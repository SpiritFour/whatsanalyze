import jsPDF from "jspdf";
import { LayoutSurface } from "~/utils/pdf/document";
import { measureBlocks } from "~/utils/pdf/measure";
import type { MeasuredBlock } from "~/utils/pdf/measure";
import { PdfWriter, emojiIdsIn } from "~/utils/pdf/emit";
import type {
  ChapterValue,
  FurnitureContext,
  WriterOptions,
} from "~/utils/pdf/emit";
import { hasEmoji, loadEmojiSprite, rasterizeEmoji } from "~/utils/pdf/emoji";
import { FurnitureRecorder } from "~/utils/pdf/furniture";
import type { FurnitureOp } from "~/utils/pdf/furniture";
import type { PageGeometry } from "~/utils/pdf/page";
import {
  DEFAULT_FONT,
  PDF_FONT_FAMILY,
  registerPdfFonts,
} from "~/utils/pdf/fonts";
import type { PdfFont } from "~/utils/pdf/fonts";
import PdfWriterWorker from "~/utils/pdf/writer.worker.ts?worker";

/**
 * The pipeline every PDF document goes through: write a stretch of the
 * document as HTML, let the browser lay it out, measure it, and transcribe it
 * onto pages. Documents differ only in their markup, stylesheet, margins and
 * page furniture.
 *
 * Layout and measuring need the DOM, so they run on the page, in batches
 * with a yield in between (see `nextFrame`). Writing the PDF (pagination,
 * drawing, and assembling and compressing the file) runs in a Web Worker
 * (utils/pdf/writer.worker.ts), so the page never waits on it. Where workers
 * are unavailable, the same writer runs on the page instead.
 */

type Furniture = (_context: FurnitureContext) => void;

/** Where the PDF is written: in a worker, or on the page as a fallback. */
interface Writer {
  addEmoji(_pngs: Record<string, string>): Promise<void>;
  place(_blocks: MeasuredBlock[]): Promise<void>;
  finish(_title: string, _furniture: Furniture): Promise<Blob>;
  dispose(): void;
}

class PageWriter implements Writer {
  private writer: PdfWriter;

  constructor(options: WriterOptions) {
    this.writer = new PdfWriter(options);
  }

  async addEmoji(pngs: Record<string, string>) {
    this.writer.addEmoji(pngs);
  }

  async place(blocks: MeasuredBlock[]) {
    this.writer.place(blocks);
  }

  async finish(title: string, furniture: Furniture) {
    return this.writer.finish(title, furniture);
  }

  dispose() {}
}

class WorkerWriter implements Writer {
  private worker: Worker;
  private nextId = 0;
  private pending = new Map<
    number,
    { resolve: (_value: any) => void; reject: (_error: Error) => void }
  >();

  private options: WriterOptions;

  constructor(worker: Worker, options: WriterOptions) {
    this.worker = worker;
    this.options = options;
    worker.onmessage = ({ data }) => {
      const call = this.pending.get(data.id);
      if (!call) return;
      this.pending.delete(data.id);
      if (data.error) call.reject(new Error(data.error));
      else call.resolve(data.result);
    };
    worker.onerror = (event) => {
      const error = new Error(event.message || "PDF writer failed");
      for (const call of this.pending.values()) call.reject(error);
      this.pending.clear();
    };
  }

  private call<T>(type: string, payload?: unknown): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }

  init() {
    return this.call<void>("init", this.options);
  }

  addEmoji(pngs: Record<string, string>) {
    return this.call<void>("emoji", pngs);
  }

  // Waited for, so the page never runs more than a batch ahead of the
  // writer and the batches do not pile up in memory.
  place(blocks: MeasuredBlock[]) {
    return this.call<void>("place", blocks);
  }

  async finish(title: string, furniture: Furniture) {
    const chapters = await this.call<string[]>("chapters");
    const pages = recordFurniture(this.options, chapters, furniture);
    const bytes = await this.call<ArrayBuffer>("finish", { title, pages });
    return new Blob([bytes], { type: "application/pdf" });
  }

  dispose() {
    this.worker.terminate();
  }
}

/**
 * Runs the document's furniture callback for every page against a
 * recorder, with a jsPDF of the same size and fonts to answer its measuring.
 */
function recordFurniture(
  options: WriterOptions,
  chapters: string[],
  furniture: Furniture,
): FurnitureOp[][] {
  const { geometry } = options;
  const measure = new jsPDF({
    unit: "mm",
    format: [geometry.widthMm, geometry.heightMm],
    orientation: "portrait",
  });
  registerPdfFonts(measure, [DEFAULT_FONT, ...(options.fonts ?? [])]);

  return chapters.map((chapter, index) => {
    const recorder = new FurnitureRecorder(measure);
    measure.setFont(PDF_FONT_FAMILY, "normal");
    furniture({
      doc: recorder,
      page: index + 1,
      total: chapters.length,
      chapter,
      geometry,
      fontFamily: PDF_FONT_FAMILY,
    });
    return recorder.ops;
  });
}

async function createWriter(options: WriterOptions): Promise<Writer> {
  if (typeof Worker !== "undefined") {
    try {
      const writer = new WorkerWriter(new PdfWriterWorker(), options);
      await writer.init();
      return writer;
    } catch (error) {
      console.warn("PDF writer worker unavailable, writing on the page", error);
    }
  }
  return new PageWriter(options);
}

export class PdfBuilder {
  private surface: LayoutSurface;
  private writer: Writer;
  readonly sprite: Map<string, string>;
  /** Emoji already rasterised and handed to the writer. */
  private sentEmoji = new Set<string>();

  private constructor(
    surface: LayoutSurface,
    writer: Writer,
    sprite: Map<string, string>,
  ) {
    this.surface = surface;
    this.writer = writer;
    this.sprite = sprite;
  }

  static async create(options: {
    geometry: PageGeometry;
    css: string;
    background: ChapterValue;
    backgroundImage?: ChapterValue;
    /** Fonts beyond the default, embedded and laid out from the same bytes. */
    fonts?: PdfFont[];
    /** Only fetch emoji artwork when there is an emoji to draw. */
    needsEmoji: boolean;
  }): Promise<PdfBuilder> {
    const sprite = options.needsEmoji
      ? await loadEmojiSprite()
      : new Map<string, string>();
    const surface = await LayoutSurface.create(
      options.geometry,
      options.css,
      options.fonts,
    );
    const writer = await createWriter({
      geometry: options.geometry,
      background: options.background,
      backgroundImage: options.backgroundImage,
      fonts: options.fonts,
    });
    return new PdfBuilder(surface, writer, sprite);
  }

  /** Lays out and places the next stretch of the document. */
  async add(html: string): Promise<void> {
    if (!html) return;
    const elements = await this.surface.render(html);
    const blocks = measureBlocks(this.surface, elements);

    // Emoji need a canvas to rasterise, so that happens here; each icon is
    // handed to the writer once, however often it appears.
    const pngs: Record<string, string> = {};
    for (const id of emojiIdsIn(blocks)) {
      if (this.sentEmoji.has(id)) continue;
      this.sentEmoji.add(id);
      const png = await rasterizeEmoji(id, this.sprite);
      if (png) pngs[id] = png;
    }
    if (Object.keys(pngs).length) await this.writer.addEmoji(pngs);

    await this.writer.place(blocks);
  }

  finish(title: string, furniture: Furniture): Promise<Blob> {
    return this.writer.finish(title, furniture);
  }

  destroy(): void {
    this.surface.destroy();
    this.writer.dispose();
  }
}

/** Does any of this text contain emoji? Decides whether to fetch artwork. */
export function anyEmoji(texts: Array<string | null | undefined>): boolean {
  return texts.some((text) => !!text && hasEmoji(text));
}

/**
 * Wait until the browser has painted, so the "putting the pages together"
 * state is on screen before the last step (which, on the page fallback,
 * holds the thread for seconds on a long chat).
 */
export const paintFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

/** Hand the thread back so the progress bar can actually repaint. */
export const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Attachment bytes as a data URL the layout frame can show and jsPDF can
 * embed. JPEG data is embedded as-is, so the picture in the PDF is the file
 * the export contains.
 */
export async function toDataUrl(
  data: Uint8Array,
  mimeType: string,
): Promise<string> {
  const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: mimeType });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
