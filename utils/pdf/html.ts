import { escapeHtml, messageToHtml } from "~/utils/pdf/emoji";

/**
 * The markup conventions the measuring pass understands.
 *
 * Every block carries `data-block` (the unit pagination works with) and
 * `data-chapter` (which decides the page background). Every piece of text is
 * wrapped in a `.wa-w` span so the measuring pass gets one box per word
 * straight from the browser's line breaker, instead of re-implementing text
 * wrapping the way the old jsPDF code had to.
 *
 * Optional block attributes, all read by utils/pdf/measure.ts:
 *
 * - `data-break-before`  start the block on a fresh page
 * - `data-keep-with-next` never leave the block alone at the bottom of a page
 * - `data-splittable`    may be broken across pages at a line boundary when it
 *                        does not fit, instead of moving whole to the next page
 * - `data-table`         the block is a row of the named table
 * - `data-table-header`  the block is the header of the named table; it is
 *                        repeated at the top of every page the table's rows
 *                        continue on
 *
 * Inside a block, an element marked `data-continuation` is only drawn on the
 * pages a split block continues on (e.g. a "cont." marker).
 */

export interface BlockOptions {
  breakBefore?: boolean;
  keepWithNext?: boolean;
  splittable?: boolean;
  table?: string;
  tableHeader?: string;
  className?: string;
}

/** Splits already-escaped markup into per-word spans, leaving `<img>` alone. */
export function wrapWords(html: string): string {
  return html.replace(/(<img\b[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag;
    return (text as string).replace(
      /[^\s]+/g,
      (word: string) => `<span class="wa-w">${word}</span>`,
    );
  });
}

/** Plain text that still needs a measurable box. */
export function words(text: string): string {
  return wrapWords(escapeHtml(text));
}

/**
 * Text that may hold emoji (a name like "Mom ❤️", a group called "Family
 * 🏡", a cover title): measurable word spans, with every emoji as artwork. Plain
 * `words()` would print an emoji as text, which no PDF font can draw.
 */
export function emojiText(text: string, sprite: Map<string, string>): string {
  return wrapWords(messageToHtml(String(text ?? ""), sprite));
}

export function block(
  chapter: string,
  html: string,
  options: BlockOptions = {},
): string {
  const attributes = [
    `class="wa-block ${options.className || ""}"`,
    "data-block",
    `data-chapter="${chapter}"`,
    options.breakBefore ? 'data-break-before="1"' : "",
    options.keepWithNext ? 'data-keep-with-next="1"' : "",
    options.splittable ? 'data-splittable="1"' : "",
    options.table ? `data-table="${options.table}"` : "",
    options.tableHeader ? `data-table-header="${options.tableHeader}"` : "",
  ];
  return `<div ${attributes.filter(Boolean).join(" ")}>${html}</div>`;
}
