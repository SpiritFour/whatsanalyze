/**
 * Page geometry shared by every PDF document.
 *
 * Each document (the visual chat story, the court transcript) picks its own
 * margins; the layout surface, the emitter and the stylesheet all derive their
 * numbers from the same object, so the width the browser wraps text in is the
 * width the PDF prints it in.
 */

/** CSS reference pixels per millimetre (1px = 1/96in by definition). */
export const PX_PER_MM = 96 / 25.4;

export interface PageGeometry {
  widthMm: number;
  heightMm: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export const A4 = { widthMm: 210, heightMm: 297 };

export const px = (mm: number) => mm * PX_PER_MM;
export const mm = (pixels: number) => pixels / PX_PER_MM;

/** CSS pixels are 1/96in, PDF points 1/72in. */
export const pt = (pixels: number) => pixels * 0.75;

export function pageWidthPx(geometry: PageGeometry): number {
  return px(geometry.widthMm);
}

export function contentWidthPx(geometry: PageGeometry): number {
  return px(geometry.widthMm - geometry.margin.left - geometry.margin.right);
}

export function contentHeightPx(geometry: PageGeometry): number {
  return px(geometry.heightMm - geometry.margin.top - geometry.margin.bottom);
}
