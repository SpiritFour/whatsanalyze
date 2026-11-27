import type { Box, LayoutSurface } from "~/utils/pdf/document";

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
  /** One of the document's registered font families. */
  fontFamily: string;
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

/** A clickable area: becomes a link annotation over whatever is drawn there. */
export interface LinkItem {
  kind: "link";
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
}

export type RenderItem = RectItem | TextItem | ImageItem | LinkItem;

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

function radiusOf(style: CSSStyleDeclaration, box: Box): number {
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
      top: box.y,
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

  const background = isPainted(style.backgroundColor);
  // The shorthand is "none" when no side has a border: one read, not twelve.
  const bordered = style.borderStyle !== "none";
  const clips = style.overflowX !== "visible" || style.overflowY !== "visible";
  const isImage = element.tagName === "IMG";
  const href = element.tagName === "A" ? element.getAttribute("href") : null;
  // Only an element that paints, clips or links needs its own box.
  const box =
    background || bordered || clips || isImage ? surface.boxOf(element) : null;

  // Parents before children, so backgrounds land under their own content.
  if (background && box && box.width && box.height) {
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

  if (bordered && box) collectBorders(style, box, target);

  // A link keeps working in the PDF: one clickable area per line it wraps to.
  if (href && /^https?:\/\//.test(href)) {
    for (const rect of surface.rectsOf(element)) {
      target.push({
        kind: "link",
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        url: href,
      });
    }
  }

  // The element belongs to the layout frame's realm, so `instanceof` against
  // this window's HTMLImageElement would never match.
  if (isImage && box) {
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
        src: image.dataset.emoji ? null : embeddableSource(image),
        format: image.src.startsWith("data:")
          ? element.dataset.format || "PNG"
          : "PNG",
        emojiId: element.dataset.emoji || null,
        radius: radiusOf(style, box),
      });
    }
    return;
  }

  // `overflow: hidden` is how a stylesheet says "at most this much": a clamped
  // column, a one-line caption. The browser still lays out what it hides, so
  // the clip has to be applied here or the hidden lines would be printed.
  let clip = parentClip;
  if (clips && box) {
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

  // Text and elements in document order, so they are drawn in it too. Text
  // takes everything it shows from this element's style: one style lookup per
  // element, not one per word.
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === TEXT_NODE) {
      collectText(surface, child as Text, style, target, clip);
    } else if (child.nodeType === ELEMENT_NODE) {
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
}

// Node types by number: the elements belong to the layout frame's realm.
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const WORD = /\S+/g;

/**
 * jsPDF embeds images from data URLs only. A bundled asset arrives as a URL
 * (anything Vite did not inline), so it is drawn to a canvas and read back:
 * it is already decoded and same-origin, so this cannot fail on taint.
 */
function embeddableSource(image: HTMLImageElement): string {
  if (image.src.startsWith("data:")) return image.src;
  try {
    const canvas = image.ownerDocument.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")?.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Could not embed an image in the PDF", error);
    return image.src;
  }
}

/**
 * `text-transform` changes what the browser shows without changing the DOM
 * text. Measured from the shown text, drawn from the DOM text, the two would
 * disagree, so the transform is applied here.
 */
function transformText(text: string, transform: string): string {
  if (transform === "uppercase") return text.toLocaleUpperCase();
  if (transform === "lowercase") return text.toLocaleLowerCase();
  if (transform === "capitalize") {
    return text.replace(
      /(^|\s)(\S)/gu,
      (_, space, letter) => space + letter.toLocaleUpperCase(),
    );
  }
  return text;
}

/** Solid borders become filled rectangles along each painted edge. */
function collectBorders(
  style: CSSStyleDeclaration,
  box: Box,
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
  node: Text,
  style: CSSStyleDeclaration,
  items: RenderItem[],
  clip: Clip | null,
): void {
  const data = node.data;
  if (!/\S/.test(data)) return;

  const fontSize = parseFloat(style.fontSize);
  const bold = parseInt(style.fontWeight, 10) >= 600;
  const fontFamily = surface.familyOf(style.fontFamily);
  const { ascent, descent } = surface.metricsFor(fontSize, bold, fontFamily);
  const color = style.color;
  const transform = style.textTransform;

  const push = (rect: Box, runText: string) => {
    if (!runText) return;
    if (!insideClip(clip, rect.x, rect.y, rect.width, rect.height)) return;
    items.push({
      kind: "text",
      x: rect.x,
      y: rect.y,
      height: rect.height,
      width: rect.width,
      baseline: rect.y + (rect.height - (ascent + descent)) / 2 + ascent,
      // The browser lays out the transformed text, so that is what is drawn.
      text: transformText(runText, transform),
      fontSize,
      bold,
      color,
      fontFamily,
    });
  };

  const range = surface.range;
  WORD.lastIndex = 0;
  for (let match = WORD.exec(data); match; match = WORD.exec(data)) {
    const start = match.index;
    const end = start + match[0].length;
    range.setStart(node, start);
    range.setEnd(node, end);
    const rects = surface.rectsOf(range);
    if (rects.length === 0) continue;
    if (rects.length === 1) {
      push(rects[0], match[0]);
      continue;
    }
    // `overflow-wrap: anywhere` can break a long word (a URL, a hash, a wall
    // of characters) across lines: re-measure that rare word character by
    // character, so each fragment is drawn on the line it was put on.
    splitAcrossLines(surface, node, start, end, push);
  }
}

function splitAcrossLines(
  surface: LayoutSurface,
  node: Text,
  start: number,
  end: number,
  push: (_rect: Box, _text: string) => void,
): void {
  const range = surface.document.createRange();
  let runStart = start;
  let runRect: Box | null = null;
  let runRight = 0;

  const flush = (to: number) => {
    if (!runRect) return;
    push(
      {
        x: runRect.x,
        y: runRect.y,
        width: runRight - runRect.x,
        height: runRect.height,
      },
      node.data.slice(runStart, to),
    );
  };

  for (let index = start; index < end; index++) {
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
  flush(end);
}
