import jsPDF from "jspdf";
import { PDF_FONT_FAMILY, registerPdfFont } from "~/utils/pdf/fonts";
import { rasterizeEmoji } from "~/utils/pdf/emoji";
import type { MeasuredBlock, RenderItem } from "~/utils/pdf/measure";
import { CHAPTER_BACKGROUND } from "~/utils/pdf/template";
import type { Chapter } from "~/utils/pdf/template";
import {
  COLORS,
  CONTENT_HEIGHT_PX,
  PAGE,
  PAGE_MARGIN_PX,
  PX_PER_MM,
} from "~/utils/pdf/theme";

/**
 * Turns measured boxes into a real PDF.
 *
 * Everything here is vector: text is drawn with `text()` so it stays
 * selectable, searchable and copyable, and shapes are drawn with
 * `roundedRect()`. The only raster content is genuine imagery -- attachments,
 * chart snapshots and emoji artwork.
 *
 * Pagination lives here rather than in CSS because the browser's own
 * fragmentation gives no way to number pages; owning it means "Page X of Y" is
 * just arithmetic.
 */

const mm = (px: number) => px / PX_PER_MM;

/** CSS pixels are 1/96in, PDF points 1/72in. */
const pt = (px: number) => px * 0.75;

/**
 * Colours arrive from two places: `rgb()/rgba()` strings read off computed
 * styles, and hex literals from the theme. Both have to work -- a hex value
 * falling through to black here paints whole pages the wrong colour.
 */
function parseColor(color: string): [number, number, number] {
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

export class PdfWriter {
  private doc: jsPDF;
  private pageChapters: Chapter[] = [];
  private cursor = 0;
  private started = false;

  constructor() {
    // eslint-disable-next-line new-cap
    this.doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      // Drawing a word at a time means a lot of very repetitive content stream;
      // uncompressed, a long chat runs to tens of megabytes.
      compress: true,
    });
    registerPdfFont(this.doc);
  }

  private get chapter(): Chapter | null {
    return this.pageChapters[this.pageChapters.length - 1] ?? null;
  }

  private newPage(chapter: Chapter): void {
    if (this.started) this.doc.addPage("a4", "p");
    this.started = true;

    this.pageChapters.push(chapter);
    this.cursor = 0;

    const [r, g, b] = parseColor(CHAPTER_BACKGROUND[chapter]);
    this.doc.setFillColor(r, g, b);
    this.doc.rect(0, 0, PAGE.widthMm, PAGE.heightMm, "F");
  }

  /**
   * Places blocks onto pages. A block is kept whole unless it is taller than a
   * page on its own, in which case it is sliced -- a single enormous message
   * still has to go somewhere.
   */
  async place(
    blocks: MeasuredBlock[],
    sprite: Map<string, string>
  ): Promise<void> {
    await this.preloadEmoji(blocks, sprite);

    for (const block of blocks) {
      const needsBreak =
        !this.started || block.breakBefore || block.chapter !== this.chapter;

      if (needsBreak) this.newPage(block.chapter);

      if (block.height > CONTENT_HEIGHT_PX) {
        this.placeOversized(block);
        continue;
      }

      if (this.cursor + block.height > CONTENT_HEIGHT_PX) {
        this.newPage(block.chapter);
      }

      const offset = this.cursor - block.top;
      for (const item of block.items) this.draw(item, offset);
      this.cursor += block.height;
    }
  }

  /** Flows one block's items across as many pages as it needs. */
  private placeOversized(block: MeasuredBlock): void {
    let consumed = 0;

    while (consumed < block.height) {
      if (this.cursor >= CONTENT_HEIGHT_PX) this.newPage(block.chapter);

      const available = CONTENT_HEIGHT_PX - this.cursor;
      const sliceEnd = Math.min(consumed + available, block.height);
      const offset = this.cursor - block.top - consumed;

      for (const item of block.items) {
        const top = item.kind === "text" ? item.baseline : item.y;
        const relative = top - block.top;

        if (item.kind === "rect") {
          // Clip the background to this page so it stops at the margin instead
          // of running off the sheet.
          const rectTop = Math.max(relative, consumed);
          const rectBottom = Math.min(relative + item.height, sliceEnd);
          if (rectBottom <= rectTop) continue;
          this.draw(
            {
              ...item,
              y: block.top + rectTop,
              height: rectBottom - rectTop,
              // Only round the corners that are actually on this page.
              radius:
                relative >= consumed && relative + item.height <= sliceEnd
                  ? item.radius
                  : 0,
            },
            offset
          );
          continue;
        }

        if (relative < consumed || relative >= sliceEnd) continue;
        this.draw(item, offset);
      }

      this.cursor += sliceEnd - consumed;
      consumed = sliceEnd;
    }
  }

  private async preloadEmoji(
    blocks: MeasuredBlock[],
    sprite: Map<string, string>
  ): Promise<void> {
    const ids = new Set<string>();
    for (const block of blocks) {
      for (const item of block.items) {
        if (item.kind === "image" && item.emojiId) ids.add(item.emojiId);
      }
    }

    // Rasterising is memoised per icon, so a chat that uses the same emoji
    // thousands of times pays for it once.
    await Promise.all(
      Array.from(ids).map(async (id) => {
        const png = await rasterizeEmoji(id, sprite);
        if (png) this.emojiPng.set(id, png);
      })
    );
  }

  private emojiPng = new Map<string, string>();

  private draw(item: RenderItem, offset: number): void {
    const x = PAGE_MARGIN_PX;

    if (item.kind === "rect") {
      const [r, g, b] = parseColor(item.color);
      this.doc.setFillColor(r, g, b);
      const width = mm(item.width);
      const height = mm(item.height);
      const left = mm(x + item.x);
      const top = mm(PAGE_MARGIN_PX + item.y + offset);

      if (item.radius > 0) {
        const radius = mm(item.radius);
        this.doc.roundedRect(left, top, width, height, radius, radius, "F");
      } else {
        this.doc.rect(left, top, width, height, "F");
      }
      return;
    }

    if (item.kind === "image") {
      const src = item.emojiId ? this.emojiPng.get(item.emojiId) : item.src;
      if (!src) return;

      try {
        this.doc.addImage(
          src,
          item.emojiId ? "PNG" : normalizeFormat(item.format),
          mm(x + item.x),
          mm(PAGE_MARGIN_PX + item.y + offset),
          mm(item.width),
          mm(item.height)
        );
      } catch (error) {
        // One unreadable attachment must not cost the buyer the whole export.
        console.error("Could not place an image in the PDF", error);
      }
      return;
    }

    const [r, g, b] = parseColor(item.color);
    this.doc.setTextColor(r, g, b);
    this.doc.setFont(PDF_FONT_FAMILY, item.bold ? "bold" : "normal");
    this.doc.setFontSize(pt(item.fontSize));
    this.doc.text(
      item.text,
      mm(x + item.x),
      mm(PAGE_MARGIN_PX + item.baseline + offset),
      { baseline: "alphabetic" }
    );
  }

  /**
   * Stamps the running header and "Page X of Y" onto every page. Deferred to
   * the end because the total is only known once the last block is placed.
   */
  private addPageFurniture(
    title: string,
    pageLabel: (page: number, total: number) => string
  ): void {
    const total = this.pageChapters.length;

    for (let page = 1; page <= total; page++) {
      const chapter = this.pageChapters[page - 1];
      // The cover is the title page; numbering it would be noise.
      if (chapter === "cover") continue;

      this.doc.setPage(page);
      this.doc.setFont(PDF_FONT_FAMILY, "normal");

      const onDark =
        chapter === "messages" || chapter === "outro" || chapter === "facts";
      const [r, g, b] = parseColor(onDark ? COLORS.mutedText : "#6b7280");
      this.doc.setTextColor(r, g, b);

      this.doc.setFontSize(8);
      this.doc.text(title, PAGE.marginMm, PAGE.marginMm / 2 + 2);
      this.doc.text(
        pageLabel(page, total),
        PAGE.widthMm - PAGE.marginMm,
        PAGE.heightMm - PAGE.marginMm / 2,
        { align: "right" }
      );
    }
  }

  finish(
    title: string,
    pageLabel: (page: number, total: number) => string
  ): Blob {
    this.addPageFurniture(title, pageLabel);
    return this.doc.output("blob");
  }
}
