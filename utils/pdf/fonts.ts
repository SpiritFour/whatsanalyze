import type jsPDF from "jspdf";
import myFont from "~/assets/pdf-fonts/Helvetica.js";

/**
 * Fonts, shared by both halves of the pipeline.
 *
 * The layout pass measures text with the browser and the emit pass draws it
 * with jsPDF. Those two only agree if they use the same font file, so each
 * font's TTF is registered with jsPDF and declared as an @font-face in the
 * layout document, from the same bytes. Two different files would make every
 * measured x-position drift against the glyphs actually drawn.
 *
 * "WaPdf" is always there; a document can add more (the chat tool's font
 * choice, utils/pdf/chatFonts.ts).
 */

export const PDF_FONT_FAMILY = "WaPdf";

export interface PdfFont {
  /** The CSS and jsPDF family name. */
  family: string;
  /** Base64 TTF data for the 400 and 700 weights. */
  normal: string;
  bold: string;
}

export const DEFAULT_FONT: PdfFont = {
  family: PDF_FONT_FAMILY,
  normal: myFont.normal,
  bold: myFont.bold,
};

export function registerPdfFonts(doc: jsPDF, fonts: PdfFont[]): void {
  for (const font of fonts) {
    // Distinct VFS filenames per weight: writing both to one name leaves
    // jsPDF resolving "normal" to whichever was added last.
    doc.addFileToVFS(`${font.family}-normal.ttf`, font.normal);
    doc.addFont(`${font.family}-normal.ttf`, font.family, "normal");
    doc.addFileToVFS(`${font.family}-bold.ttf`, font.bold);
    doc.addFont(`${font.family}-bold.ttf`, font.family, "bold");
  }
  doc.setFont(PDF_FONT_FAMILY, "normal");
}

/** @font-face rules for the layout document, from the embedded bytes. */
export function fontFaceCss(fonts: PdfFont[]): string {
  return fonts
    .map((font) =>
      [
        [400, font.normal],
        [700, font.bold],
      ]
        .map(
          ([weight, data]) => `
@font-face {
  font-family: "${font.family}";
  font-style: normal;
  font-weight: ${weight};
  src: url(data:font/truetype;charset=utf-8;base64,${data}) format("truetype");
}`,
        )
        .join(""),
    )
    .join("");
}

export function pdfFontFaceCss(): string {
  return fontFaceCss([DEFAULT_FONT]);
}
