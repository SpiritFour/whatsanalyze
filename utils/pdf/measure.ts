import type { LayoutSurface } from "~/utils/pdf/document";

/**
 * Reads the browser's finished layout back out as a flat list of drawing
 * instructions.
 *
 * This is the half that replaces the old imperative coordinate maths: the
 * browser has already decided where every word, bubble, rule and image goes,
 * so nothing here computes a position -- it only transcribes one. Everything is
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
  /** Top and bottom of the line box the word sits on. */
  y: number;
  height: number;
  width: number;
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
  chapter: string;
  breakBefore: boolean;
  keepWithNext: boolean;
  splittable: boolean;
  table: string | null;
  tableHeader: string | null;
  items: RenderItem[];
  /** Drawn only at the top of the pages a split block continues on. */
  continuationItems: RenderItem[];
}

const TRANSPARENT = /^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/;

function isPainted(color: string): boolean {
  if (!color || TRANSPARENT.test(color)) return false;
  const alpha = color.match(/rgba\([^)]*,\s*([\d.]+)\s*\)$/);
  return !alpha || parseFloat(alpha[1]) > 0;
}

function radiusOf(style: CSSStyleDeclaration, box: DOMRect): number {
  const radius = parseFloat(style.borderTopLeftRadius) || 0;
  // Pill shapes are authored as a huge radius; PDF wants a real one.
  return Math.min(radius, box.width / 2, box.height / 2);
}

interface Clip {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Half a pixel of slack, so rounding never drops a word that fits. */
const CLIP_TOLERANCE = 0.5;

function insideClip(
  clip: Clip | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!clip) return true;
  return (
    x >= clip.left - CLIP_TOLERANCE &&
    y >= clip.top - CLIP_TOLERANCE &&
    x + w <= clip.right + CLIP_TOLERANCE &&
    y + h <= clip.bottom + CLIP_TOLERANCE
  );
}

export function measureBlocks(
  surface: LayoutSurface,
  blocks: HTMLElement[],
): MeasuredBlock[] {
  return blocks.map((element) => {
    const box = surface.boxOf(element);
    const items: RenderItem[] = [];
    const continuationItems: RenderItem[] = [];
    collect(surface, element, items, continuationItems, null, false);

    const data = element.dataset;
    return {
      top: box.top,
      height: box.height,
      chapter: data.chapter || "default",
      breakBefore: data.breakBefore === "1",
      keepWithNext: data.keepWithNext === "1",
      splittable: data.splittable === "1",
      table: data.table || null,
      tableHeader: data.tableHeader || null,
      items,
      continuationItems,
    };
  });
}

function collect(
  surface: LayoutSurface,
  element: HTMLElement,
  items: RenderItem[],
  continuationItems: RenderItem[],
  parentClip: Clip | null,
  inContinuation: boolean,
): void {
  const style = surface.window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return;

  const isContinuation = inContinuation || "continuation" in element.dataset;
  const target = isContinuation ? continuationItems : items;
  const box = surface.boxOf(element);

  // Parents before children, so backgrounds land under their own content.
  if (isPainted(style.backgroundColor) && box.width && box.height) {
    target.push({
      kind: "rect",
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      color: style.backgroundColor,
      radius: radiusOf(style, box),
    });
  }

  collectBorders(style, box, target);

  // The element belongs to the layout frame's realm, so `instanceof` against
  // this window's HTMLImageElement would never match.
  if (element.tagName === "IMG") {
    const image = element as HTMLImageElement;
    if (
      box.width &&
      box.height &&
      insideClip(parentClip, box.x, box.y, box.width, box.height)
    ) {
      target.push({
        kind: "image",
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        src: image.dataset.emoji ? null : image.src,
        format: element.dataset.format || "PNG",
        emojiId: element.dataset.emoji || null,
        radius: radiusOf(style, box),
      });
    }
    return;
  }

  if (element.classList.contains("wa-w")) {
    collectText(surface, element, style, target, parentClip);
    return;
  }

  // `overflow: hidden` is how a stylesheet says "at most this much": a clamped
  // column, a one-line caption. The browser still lays out what it hides, so
  // the clip has to be applied here or the hidden lines would be printed.
  let clip = parentClip;
  if (style.overflowX !== "visible" || style.overflowY !== "visible") {
    const own = {
      left: box.x,
      top: box.y,
      right: box.x + box.width,
      bottom: box.y + box.height,
    };
    clip = parentClip
      ? {
          left: Math.max(own.left, parentClip.left),
          top: Math.max(own.top, parentClip.top),
          right: Math.min(own.right, parentClip.right),
          bottom: Math.min(own.bottom, parentClip.bottom),
        }
      : own;
  }

  for (const child of Array.from(element.children)) {
    collect(
      surface,
      child as HTMLElement,
      items,
      continuationItems,
      clip,
      isContinuation,
    );
  }
}

/** Solid borders become filled rectangles along each painted edge. */
function collectBorders(
  style: CSSStyleDeclaration,
  box: DOMRect,
  items: RenderItem[],
): void {
  const sides = [
    ["Top", (w: number) => [box.x, box.y, box.width, w]],
    ["Bottom", (w: number) => [box.x, box.y + box.height - w, box.width, w]],
    ["Left", (w: number) => [box.x, box.y, w, box.height]],
    ["Right", (w: number) => [box.x + box.width - w, box.y, w, box.height]],
  ] as const;

  for (const [side, rect] of sides) {
    const width = parseFloat(
      style.getPropertyValue(`border-${side.toLowerCase()}-width`),
    );
    const lineStyle = style.getPropertyValue(
      `border-${side.toLowerCase()}-style`,
    );
    const color = style.getPropertyValue(`border-${side.toLowerCase()}-color`);
    if (!width || lineStyle === "none" || lineStyle === "hidden") continue;
    if (!isPainted(color)) continue;

    const [x, y, w, h] = rect(width);
    items.push({ kind: "rect", x, y, width: w, height: h, color, radius: 0 });
  }
}

function collectText(
  surface: LayoutSurface,
  span: HTMLElement,
  style: CSSStyleDeclaration,
  items: RenderItem[],
  clip: Clip | null,
): void {
  const text = span.textContent ?? "";
  if (!text) return;

  const fontSize = parseFloat(style.fontSize);
  const bold = parseInt(style.fontWeight, 10) >= 600;
  const { ascent, descent } = surface.metricsFor(fontSize, bold);
  const color = style.color;

  const push = (rect: DOMRect, runText: string) => {
    if (!runText) return;
    if (!insideClip(clip, rect.x, rect.y, rect.width, rect.height)) return;
    items.push({
      kind: "text",
      x: rect.x,
      y: rect.y,
      height: rect.height,
      width: rect.width,
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

  // `overflow-wrap: anywhere` can break a long word (a URL, a hash, a wall of
  // characters) across lines, leaving the span with one box per line.
  // Re-measure that rare word character by character so each fragment is drawn
  // on the line the browser actually put it on.
  const node = span.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) {
    push(rects[0], text);
    return;
  }

  const range = surface.document.createRange();
  let runStart = 0;
  let runRect: DOMRect | null = null;
  let runRight = 0;

  const flush = (end: number) => {
    if (!runRect) return;
    push(
      new DOMRect(runRect.x, runRect.y, runRight - runRect.x, runRect.height),
      text.slice(runStart, end),
    );
  };

  for (let index = 0; index < text.length; index++) {
    range.setStart(node, index);
    range.setEnd(node, index + 1);
    const charRect = surface.rectsOf(range)[0];
    if (!charRect) continue;

    if (!runRect || Math.abs(charRect.y - runRect.y) > 0.5) {
      flush(index);
      runRect = charRect;
      runStart = index;
    }
    runRight = charRect.x + charRect.width;
  }

  flush(text.length);
}
