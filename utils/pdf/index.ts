/**
 * Every PDF the site produces, printed from HTML.
 *
 * Each document is written as HTML/CSS, laid out by the browser in an offscreen
 * frame, measured, and transcribed into vector PDF -- see utils/pdf/builder.ts
 * for the pipeline and docs/pdf-export.md for the why.
 *
 * - renderChatPdf:  the visual chat story (cover, charts, chat bubbles)
 * - renderCourtPdf: the court evidence transcript
 */
export { renderChatPdf } from "~/utils/pdf/visual";
export type { RenderPdfOptions } from "~/utils/pdf/visual";
export { renderCourtPdf } from "~/utils/pdf/court";
export type { ChatSource, RenderCourtPdfOptions } from "~/utils/pdf/court";
