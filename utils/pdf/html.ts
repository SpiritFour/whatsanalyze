import { escapeHtml, messageToHtml } from "~/utils/pdf/emoji";

/**
 * The markup conventions the measuring pass understands.
 *
 * Every block carries `data-block` (the unit pagination works with) and
 * `data-chapter` (which decides the page background). Text is plain text:
 * the measuring pass reads one box per word straight from the browser's line
 * breaker, through a text Range, instead of re-implementing text wrapping the
 * way the old jsPDF code had to.
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

/**
 * Already-escaped markup, as is. Words used to be wrapped in one span each so
 * the measuring pass got a box per word; it now measures words with a text
 * Range instead (utils/pdf/measure.ts), which saves the browser laying out a
 * million extra elements in a long chat. Kept as the one place that would
 * change if text ever needs wrapping again.
 */
export function wrapWords(html: string): string {
  return html;
}

/** Plain text, escaped for the layout document. */
export function words(text: string): string {
  return escapeHtml(text);
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
