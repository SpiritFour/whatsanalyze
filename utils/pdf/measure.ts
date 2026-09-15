import type { LayoutSurface } from "~/utils/pdf/document";
import type { Chapter } from "~/utils/pdf/template";

/**
 * Reads the browser's finished layout back out as a flat list of drawing
 * instructions.
 *
 * This is the half that replaces the old imperative coordinate maths: the
 * browser has already decided where every word, bubble and image goes, so
 * nothing here computes a position -- it only transcribes one. Everything is
 * measured in CSS pixels relative to the flow container; the emitter converts
 * to millimetres once, at the end.
 *
 * No DOM mutation happens during a measuring pass. That matters for speed:
 * reads against one settled layout are cheap, while a single write between them
 * would force a reflow per word.
 */

export interface RectItem {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  radius: number;
}

export interface TextItem {
  kind: "text";
  x: number;
  /** Baseline, which is what jsPDF's text() positions from. */
  baseline: number;
  text: string;
  fontSize: number;
  bold: boolean;
  color: string;
}

export interface ImageItem {
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  /** Data URL, for everything except emoji. */
  src: string | null;
  format: string;
  /** Set for emoji: the emitter swaps in rasterised artwork for this icon. */
  emojiId: string | null;
  radius: number;
}

export type RenderItem = RectItem | TextItem | ImageItem;

export interface MeasuredBlock {
  top: number;
  height: number;
  chapter: Chapter;
  breakBefore: boolean;
  items: RenderItem[];
}

const TRANSPARENT = /^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/;

function isPaintedBackground(color: string): boolean {
  if (!color || TRANSPARENT.test(color)) return false;
  const alpha = color.match(/rgba\([^)]*,\s*([\d.]+)\s*\)$/);
  return !alpha || parseFloat(alpha[1]) > 0;
}

function radiusOf(style: CSSStyleDeclaration, box: DOMRect): number {
  const radius = parseFloat(style.borderTopLeftRadius) || 0;
  // Pill shapes are authored as a huge radius; PDF wants a real one.
  return Math.min(radius, box.width / 2, box.height / 2);
}

export function measureBlocks(
  surface: LayoutSurface,
  blocks: HTMLElement[]
): MeasuredBlock[] {
  return blocks.map((element) => {
    const box = surface.boxOf(element);
    const items: RenderItem[] = [];
    collect(surface, element, items);

    return {
      top: box.top,
      height: box.height,
      chapter: (element.dataset.chapter || "messages") as Chapter,
      breakBefore: element.dataset.breakBefore === "1",
      items,
    };
  });
}

function collect(
  surface: LayoutSurface,
  element: HTMLElement,
  items: RenderItem[]
): void {
  const style = surface.window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return;

  const box = surface.boxOf(element);

  // Parents before children, so backgrounds land under their own content.
  if (isPaintedBackground(style.backgroundColor) && box.width && box.height) {
    items.push({
      kind: "rect",
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      color: style.backgroundColor,
      radius: radiusOf(style, box),
    });
  }

  if (element instanceof surface.window.HTMLImageElement) {
    if (box.width && box.height) {
      items.push({
        kind: "image",
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        src: element.dataset.emoji ? null : element.src,
        format: element.dataset.format || "PNG",
        emojiId: element.dataset.emoji || null,
        radius: radiusOf(style, box),
      });
    }
    return;
  }

  if (element.classList.contains("wa-w")) {
    collectText(surface, element, style, items);
    return;
  }

  for (const child of Array.from(element.children)) {
    collect(surface, child as HTMLElement, items);
  }
}

function collectText(
  surface: LayoutSurface,
  span: HTMLElement,
  style: CSSStyleDeclaration,
  items: RenderItem[]
): void {
  const text = span.textContent ?? "";
  if (!text) return;

  const fontSize = parseFloat(style.fontSize);
  const bold = parseInt(style.fontWeight, 10) >= 600;
  const { ascent, descent } = surface.metricsFor(fontSize, bold);
  const color = style.color;

  const push = (rect: DOMRect, runText: string) => {
    if (!runText) return;
    items.push({
      kind: "text",
      x: rect.x,
      baseline: rect.y + (rect.height - (ascent + descent)) / 2 + ascent,
      text: runText,
      fontSize,
      bold,
      color,
    });
  };

  const rects = surface.rectsOf(span);
  if (rects.length === 0) return;

  if (rects.length === 1) {
    push(rects[0], text);
    return;
  }

  // `overflow-wrap: anywhere` can break a long word (a URL, a wall of
  // characters) across lines, leaving the span with one box per line. Re-measure
  // that rare word character by character so each fragment is drawn on the line
  // the browser actually put it on.
  const node = span.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) {
    push(rects[0], text);
    return;
  }

  const range = surface.document.createRange();
  let runStart = 0;
  let runRect: DOMRect | null = null;

  for (let index = 0; index < text.length; index++) {
    range.setStart(node, index);
    range.setEnd(node, index + 1);
    const charRect = surface.rectsOf(range)[0];
    if (!charRect) continue;

    if (!runRect) {
      runRect = charRect;
      runStart = index;
      continue;
    }

    if (Math.abs(charRect.y - runRect.y) > 0.5) {
      push(runRect, text.slice(runStart, index));
      runRect = charRect;
      runStart = index;
    }
  }

  if (runRect) push(runRect, text.slice(runStart));
}
