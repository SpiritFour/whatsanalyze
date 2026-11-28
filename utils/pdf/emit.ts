import jsPDF from "jspdf";
import {
  DEFAULT_FONT,
  PDF_FONT_FAMILY,
  registerPdfFonts,
} from "~/utils/pdf/fonts";
import type { PdfFont } from "~/utils/pdf/fonts";
import { replayFurniture } from "~/utils/pdf/furniture";
import type { FurnitureDoc, FurnitureOp } from "~/utils/pdf/furniture";
import type { MeasuredBlock, RenderItem, TextItem } from "~/utils/pdf/measure";
import { contentHeightPx, mm, pt, px } from "~/utils/pdf/page";
import type { PageGeometry } from "~/utils/pdf/page";

/**
 * Turns measured boxes into a real PDF.
 *
 * Everything here is vector: text is drawn with `text()` so it stays
 * selectable, searchable and copyable, and shapes are drawn with `rect()` /
 * `roundedRect()`. The only raster content is genuine imagery -- attachments,
 * chart snapshots and emoji artwork.
 *
 * Pagination lives here rather than in CSS because the browser's own
 * fragmentation gives no way to number pages or repeat a table header; owning
 * it means "Page X of Y" is just arithmetic.
 */

/**
 * A split block needs at least this much room left on the page to start
 * there: a lone line at the bottom of a sheet, its row continuing overleaf, is
 * unreadable.
 */
const MIN_SPLIT_PX = 32;

/**
 * Colours arrive from two places: `rgb()/rgba()` strings read off computed
 * styles, and hex literals from a theme. Both have to work -- a hex value
 * falling through to black here paints whole pages the wrong colour.
 */

/** Half a CSS pixel: well under a glyph's side bearing. */
const TEXT_TOLERANCE_PX = 0.5;

export function parseColor(color: string): [number, number, number] {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((digit) => digit + digit)
            .join("")
        : hex[1];
    return [
      parseInt(digits.slice(0, 2), 16),
      parseInt(digits.slice(2, 4), 16),
      parseInt(digits.slice(4, 6), 16),
    ];
  }

  const match = color.match(/-?[\d.]+/g);
  if (!match || match.length < 3) return [0, 0, 0];
  return [Number(match[0]), Number(match[1]), Number(match[2])];
}

function normalizeFormat(format: string): string {
  const upper = format.toUpperCase();
  if (upper === "JPG" || upper === "JPE") return "JPEG";
  return upper;
}

/** Top of an item, for deciding which page slice it falls into. */
const itemTop = (item: RenderItem) => item.y;
const itemBottom = (item: RenderItem) => item.y + item.height;

export interface FurnitureContext {
  doc: FurnitureDoc;
  page: number;
  total: number;
  chapter: string;
  geometry: PageGeometry;
  fontFamily: string;
}

/**
 * Something per page, by chapter: `value` for every chapter not listed in
 * `chapters`. Data rather than a function, so it can be sent to the worker
 * that writes the PDF.
 */
export interface ChapterValue {
  value: string | null;
  chapters?: Record<string, string | null>;
}

const valueFor = (spec: ChapterValue | undefined, chapter: string) =>
  !spec
    ? null
    : spec.chapters && chapter in spec.chapters
      ? spec.chapters[chapter]
      : spec.value;

export interface WriterOptions {
  geometry: PageGeometry;
  /** Page background colour per chapter; null leaves the sheet unpainted. */
  background: ChapterValue;
  /**
   * A full-page picture per chapter (a JPEG data URL, sheet-shaped), drawn
   * over the colour. The PDF stores it once however many pages show it.
   */
  backgroundImage?: ChapterValue;
  /** Fonts beyond the default the document's text uses. */
  fonts?: PdfFont[];
}

export class PdfWriter {
  private doc: jsPDF;
  private geometry: PageGeometry;
  private background: WriterOptions["background"];
  private backgroundImage: WriterOptions["backgroundImage"];
  private contentHeight: number;
  private pageChapters: string[] = [];
  private cursor = 0;
  /** Where content starts on the current page (below a repeated header). */
  private pageStart = 0;
  private started = false;
  /** The header of the table whose rows are being placed, repeated per page. */
  private tableHeader: MeasuredBlock | null = null;
  private emojiPng = new Map<string, string>();

  constructor({ geometry, background, backgroundImage, fonts }: WriterOptions) {
    this.geometry = geometry;
    this.background = background;
    this.backgroundImage = backgroundImage;
    this.contentHeight = contentHeightPx(geometry);

    this.doc = new jsPDF({
      unit: "mm",
      format: [geometry.widthMm, geometry.heightMm],
      orientation: "portrait",
      // Drawing a word at a time means a lot of very repetitive content stream;
      // uncompressed, a long chat runs to tens of megabytes.
      compress: true,
    });
    registerPdfFonts(this.doc, [DEFAULT_FONT, ...(fonts ?? [])]);
  }

  private get chapter(): string | null {
    return this.pageChapters[this.pageChapters.length - 1] ?? null;
  }

  private get remaining(): number {
    return this.contentHeight - this.cursor;
  }

  private newPage(chapter: string): void {
    if (this.started) {
      this.doc.addPage([this.geometry.widthMm, this.geometry.heightMm], "p");
    }
    this.started = true;

    this.pageChapters.push(chapter);
    this.cursor = 0;
    this.pageStart = 0;

    const background = valueFor(this.background, chapter);
    if (background) {
      const [r, g, b] = parseColor(background);
      this.doc.setFillColor(r, g, b);
      this.doc.rect(0, 0, this.geometry.widthMm, this.geometry.heightMm, "F");
    }

    const image = valueFor(this.backgroundImage, chapter);
    if (image) {
      try {
        this.doc.addImage(
          image,
          "JPEG",
          0,
          0,
          this.geometry.widthMm,
          this.geometry.heightMm,
          // the same alias for the same picture, whichever chapter shows
          // it: embedded once, drawn often
          this.backgroundAlias(image),
        );
      } catch (error) {
        // the colour underneath still makes a page
        console.error("Could not draw the page background", error);
      }
    }
  }

  private backgroundAliases = new Map<string, string>();

  private backgroundAlias(image: string): string {
    let alias = this.backgroundAliases.get(image);
    if (!alias) {
      alias = `background-${this.backgroundAliases.size}`;
      this.backgroundAliases.set(image, alias);
    }
    return alias;
  }

  /** A page break in the middle of a table: the header comes along. */
  private continuePage(chapter: string, table: string | null): void {
    this.newPage(chapter);
    const header = this.tableHeader;
    if (header && table && header.tableHeader === table) {
      this.drawWhole(header);
    }
    this.pageStart = this.cursor;
  }

  /**
   * How much room a block needs before it may go on this page: itself, plus
   * whatever it must not be separated from.
   */
  private requiredHeight(blocks: MeasuredBlock[], index: number): number {
    let height = 0;
    for (let at = index; at < blocks.length; at++) {
      const block = blocks[at];
      const isFirst = at === index;
      const minimum =
        !isFirst && block.splittable
          ? Math.min(block.height, MIN_SPLIT_PX)
          : block.height;
      height += minimum;
      if (!block.keepWithNext) break;
    }
    return height;
  }

  /**
   * Places blocks onto pages. A block is kept whole unless it is splittable or
   * taller than a page on its own, in which case it is broken at a line
   * boundary -- a single enormous message still has to go somewhere.
   */
  place(blocks: MeasuredBlock[]): void {
    for (const block of blocks) block.items = this.mergeTextRuns(block.items);

    blocks.forEach((block, index) => {
      const table = block.tableHeader || block.table;
      // Anything that is not part of the current table ends it.
      if (this.tableHeader && this.tableHeader.tableHeader !== table) {
        this.tableHeader = null;
      }

      if (
        !this.started ||
        block.breakBefore ||
        block.chapter !== this.chapter
      ) {
        this.tableHeader = null;
        this.newPage(block.chapter);
      }

      const required = this.requiredHeight(blocks, index);
      // On a page with nothing on it yet, moving on would only leave it blank.
      const isFreshPage = this.cursor === this.pageStart;
      const fits =
        required <= this.remaining ||
        (isFreshPage && block.height <= this.remaining);

      if (block.tableHeader) {
        if (!fits && this.cursor > 0) this.newPage(block.chapter);
        this.drawWhole(block);
        this.tableHeader = block;
        return;
      }

      if (fits) {
        this.drawWhole(block);
        return;
      }

      // A block that may flow across pages starts right here. Anything else
      // moves to a fresh page first -- even one too tall for any page, which
      // would otherwise begin as a sliver at the bottom of this one.
      const splitHere = block.splittable && this.remaining >= MIN_SPLIT_PX;

      if (!splitHere && !isFreshPage) this.continuePage(block.chapter, table);

      if (block.height <= this.remaining) {
        this.drawWhole(block);
      } else {
        this.placeSliced(block, table);
      }
    });
  }

  private drawWhole(block: MeasuredBlock): void {
    const offset = this.cursor - block.top;
    for (const item of block.items) this.draw(item, offset);
    this.cursor += block.height;
  }

  /**
   * Moves a slice boundary up to the nearest line boundary, so no line of text
   * and no image is cut through the middle. Falls back to a hard cut only for
   * something taller than the whole slice.
   */
  private snapToLine(block: MeasuredBlock, start: number, end: number): number {
    let snapped = end;
    let changed = true;

    while (changed) {
      changed = false;
      for (const item of block.items) {
        if (item.kind === "rect" || item.kind === "link") continue;
        const top = itemTop(item) - block.top;
        const bottom = itemBottom(item) - block.top;
        if (top < snapped && bottom > snapped && top > start) {
          snapped = top;
          changed = true;
        }
      }
    }

    return snapped > start ? snapped : end;
  }

  /** Flows one block's items across as many pages as it needs. */
  private placeSliced(block: MeasuredBlock, table: string | null): void {
    let consumed = 0;

    while (consumed < block.height) {
      if (this.remaining < 1) this.continuePage(block.chapter, table);

      let sliceEnd = Math.min(consumed + this.remaining, block.height);
      if (sliceEnd < block.height) {
        sliceEnd = this.snapToLine(block, consumed, sliceEnd);
      }
      const offset = this.cursor - block.top - consumed;

      for (const item of block.items) {
        const top = itemTop(item) - block.top;

        if (item.kind === "rect") {
          // Clip backgrounds and rules to this page so they stop at the margin
          // instead of running off the sheet.
          const rectTop = Math.max(top, consumed);
          const rectBottom = Math.min(top + item.height, sliceEnd);
          if (rectBottom <= rectTop) continue;
          this.draw(
            {
              ...item,
              y: block.top + rectTop,
              height: rectBottom - rectTop,
              // Only round the corners that are actually on this page.
              radius:
                top >= consumed && top + item.height <= sliceEnd
                  ? item.radius
                  : 0,
            },
            offset,
          );
          continue;
        }

        if (top < consumed || top >= sliceEnd) continue;
        this.draw(item, offset);
      }

      if (consumed > 0) {
        // Continuation markers sit at the top of the block; move them to the
        // top of this slice.
        for (const item of block.continuationItems) {
          this.draw(item, this.cursor - block.top);
        }
      }

      this.cursor += sliceEnd - consumed;
      consumed = sliceEnd;

      if (consumed < block.height) this.continuePage(block.chapter, table);
    }
  }

  /**
   * Joins the words of a line into one text run wherever the PDF would put
   * each next word exactly where the browser did: same line, same style, and
   * the run's width plus one space (as jsPDF measures it) lands on the next
   * word's measured x. Anywhere else, a word keeps its own position, so
   * nothing moves; it just stops costing a whole text object per word, which
   * made a long chat's PDF, and the memory to build it, several times bigger.
   */
  private mergeTextRuns(items: RenderItem[]): RenderItem[] {
    const merged: RenderItem[] = [];
    let run: TextItem | null = null;

    const sameStyle = (a: TextItem, b: TextItem) =>
      a.fontFamily === b.fontFamily &&
      a.fontSize === b.fontSize &&
      a.bold === b.bold &&
      a.color === b.color &&
      Math.abs(a.baseline - b.baseline) < 0.1;

    for (const item of items) {
      if (item.kind !== "text") {
        if (run) merged.push(run);
        run = null;
        merged.push(item);
        continue;
      }
      // An assertion, not an annotation: TypeScript would narrow `run` to the
      // null it was last assigned in this loop body and lose the item type.
      const current = run as TextItem | null;
      if (current && sameStyle(current, item)) {
        const expected =
          current.x + this.textWidthPx(`${current.text} `, current);
        if (Math.abs(expected - item.x) <= TEXT_TOLERANCE_PX) {
          run = {
            ...current,
            text: `${current.text} ${item.text}`,
            width: item.x + item.width - current.x,
            y: Math.min(current.y, item.y),
            height:
              Math.max(current.y + current.height, item.y + item.height) -
              Math.min(current.y, item.y),
          };
          continue;
        }
      }
      if (run) merged.push(run);
      run = { ...item };
    }
    if (run) merged.push(run);
    return merged;
  }

  /** A string's width in CSS px, as jsPDF will draw it. */
  private textWidthPx(text: string, style: TextItem): number {
    this.doc.setFont(style.fontFamily, style.bold ? "bold" : "normal");
    this.doc.setFontSize(pt(style.fontSize));
    return px(this.doc.getTextWidth(text));
  }

  /**
   * Emoji artwork, rasterised on the page (it needs a canvas) and handed over
   * once per icon before the blocks that use it.
   */
  addEmoji(pngs: Record<string, string>): void {
    for (const [id, png] of Object.entries(pngs)) this.emojiPng.set(id, png);
  }

  /** Each page's chapter, in order: what the furniture is drawn from. */
  get chapters(): string[] {
    return [...this.pageChapters];
  }

  private draw(item: RenderItem, offset: number): void {
    const left = px(this.geometry.margin.left);
    const top = px(this.geometry.margin.top) + offset;

    if (item.kind === "rect") {
      const [r, g, b] = parseColor(item.color);
      this.doc.setFillColor(r, g, b);
      const width = mm(item.width);
      const height = mm(item.height);
      const x = mm(left + item.x);
      const y = mm(top + item.y);

      if (item.radius > 0) {
        const radius = mm(item.radius);
        this.doc.roundedRect(x, y, width, height, radius, radius, "F");
      } else {
        this.doc.rect(x, y, width, height, "F");
      }
      return;
    }

    if (item.kind === "link") {
      this.doc.link(
        mm(left + item.x),
        mm(top + item.y),
        mm(item.width),
        mm(item.height),
        { url: item.url },
      );
      return;
    }

    if (item.kind === "image") {
      const src = item.emojiId ? this.emojiPng.get(item.emojiId) : item.src;
      if (!src) return;

      const x = mm(left + item.x);
      const y = mm(top + item.y);
      const width = mm(item.width);
      const height = mm(item.height);
      // Rounded corners, as the stylesheet drew them: a clipping path around
      // the picture, so the image data stays untouched and the file no
      // bigger.
      const clipped = !item.emojiId && item.radius > 0;
      try {
        if (clipped) {
          const radius = mm(item.radius);
          this.doc.saveGraphicsState();
          this.doc.roundedRect(x, y, width, height, radius, radius, null);
          this.doc.clip();
          this.doc.discardPath();
        }
        this.doc.addImage(
          src,
          item.emojiId ? "PNG" : normalizeFormat(item.format),
          x,
          y,
          width,
          height,
          // An emoji is the same picture every time it appears: a fixed
          // name lets jsPDF reuse it instead of hashing the whole PNG again
          // on every one of thousands of uses.
          item.emojiId ? `emoji-${item.emojiId}` : undefined,
        );
      } catch (error) {
        // One unreadable attachment must not cost the buyer the whole export.
        console.error("Could not place an image in the PDF", error);
      } finally {
        if (clipped) this.doc.restoreGraphicsState();
      }
      return;
    }

    const [r, g, b] = parseColor(item.color);
    this.doc.setTextColor(r, g, b);
    this.doc.setFont(item.fontFamily, item.bold ? "bold" : "normal");
    this.doc.setFontSize(pt(item.fontSize));

    // A whole line measured at once (utils/pdf/measure.ts) is drawn as one
    // run. Where jsPDF's glyph widths differ from the browser's (kerning, a
    // fallback font), spread the difference over its letters so the line
    // still ends where the browser ended it. Character spacing is graphics
    // state, so it is set inside a save/restore pair and leaks nowhere.
    // A single word keeps jsPDF's own widths, as it always has.
    const isRun = item.text.includes(" ");
    const drift = isRun ? item.width - this.textWidthPx(item.text, item) : 0;
    const letters = item.text.length;
    const spread = isRun && Math.abs(drift) > TEXT_TOLERANCE_PX;
    if (spread) this.doc.saveGraphicsState();
    this.doc.text(item.text, mm(left + item.x), mm(top + item.baseline), {
      baseline: "alphabetic",
      ...(spread ? { charSpace: mm(drift / letters) } : {}),
    });
    if (spread) this.doc.restoreGraphicsState();
  }

  /**
   * Hands every page to the document's own running header and footer. Deferred
   * to the end because "Page X of Y" needs the total, which is only known once
   * the last block is placed.
   */
  finish(title: string, furniture: (_context: FurnitureContext) => void): Blob {
    const total = this.pageChapters.length;

    for (let page = 1; page <= total; page++) {
      this.doc.setPage(page);
      this.doc.setFont(PDF_FONT_FAMILY, "normal");
      furniture({
        doc: this.doc,
        page,
        total,
        chapter: this.pageChapters[page - 1],
        geometry: this.geometry,
        fontFamily: PDF_FONT_FAMILY,
      });
    }

    this.doc.setProperties({ title });
    return this.doc.output("blob");
  }

  /**
   * The same, with the furniture recorded on the page beforehand, one list
   * of drawing calls per page (see utils/pdf/furniture.ts). Returns the file's
   * bytes, which the worker can hand back without copying.
   */
  finishRecorded(title: string, pages: FurnitureOp[][]): ArrayBuffer {
    pages.forEach((ops, index) => {
      this.doc.setPage(index + 1);
      this.doc.setFont(PDF_FONT_FAMILY, "normal");
      replayFurniture(this.doc, ops);
    });
    this.doc.setProperties({ title });
    return this.doc.output("arraybuffer");
  }
}

/** The emoji a batch of blocks draws. */
export function emojiIdsIn(blocks: MeasuredBlock[]): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    for (const item of [...block.items, ...block.continuationItems]) {
      if (item.kind === "image" && item.emojiId) ids.add(item.emojiId);
    }
  }
  return ids;
}
