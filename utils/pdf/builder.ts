import { LayoutSurface } from "~/utils/pdf/document";
import { measureBlocks } from "~/utils/pdf/measure";
import { PdfWriter } from "~/utils/pdf/emit";
import type { FurnitureContext } from "~/utils/pdf/emit";
import { hasEmoji, loadEmojiSprite } from "~/utils/pdf/emoji";
import type { PageGeometry } from "~/utils/pdf/page";

/**
 * The pipeline every PDF document goes through: write a stretch of the
 * document as HTML, let the browser lay it out, measure it, and transcribe it
 * onto pages. Documents differ only in their markup, stylesheet, margins and
 * page furniture.
 *
 * This runs on the main thread by necessity: a Worker has no DOM, and the DOM
 * is the layout engine. Callers add the document in batches and yield in
 * between (see `nextFrame`), so the progress bar keeps moving and the tab stays
 * responsive.
 */
export class PdfBuilder {
  private surface: LayoutSurface;
  private writer: PdfWriter;
  readonly sprite: Map<string, string>;

  private constructor(
    surface: LayoutSurface,
    writer: PdfWriter,
    sprite: Map<string, string>,
  ) {
    this.surface = surface;
    this.writer = writer;
    this.sprite = sprite;
  }

  static async create(options: {
    geometry: PageGeometry;
    css: string;
    background: (_chapter: string) => string | null;
    /** Only fetch emoji artwork when there is an emoji to draw. */
    needsEmoji: boolean;
  }): Promise<PdfBuilder> {
    const sprite = options.needsEmoji
      ? await loadEmojiSprite()
      : new Map<string, string>();
    const surface = await LayoutSurface.create(options.geometry, options.css);
    const writer = new PdfWriter({
      geometry: options.geometry,
      background: options.background,
    });
    return new PdfBuilder(surface, writer, sprite);
  }

  /** Lays out and places the next stretch of the document. */
  async add(html: string): Promise<void> {
    if (!html) return;
    const elements = await this.surface.render(html);
    await this.writer.place(measureBlocks(this.surface, elements), this.sprite);
  }

  finish(title: string, furniture: (_context: FurnitureContext) => void): Blob {
    return this.writer.finish(title, furniture);
  }

  destroy(): void {
    this.surface.destroy();
  }
}

/** Does any of this text contain emoji? Decides whether to fetch artwork. */
export function anyEmoji(texts: Array<string | null | undefined>): boolean {
  return texts.some((text) => !!text && hasEmoji(text));
}

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
