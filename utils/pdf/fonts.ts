import type jsPDF from "jspdf";
import myFont from "~/assets/pdf-fonts/Helvetica.js";
import { fontFaceCss } from "~/utils/pdf/theme";

/**
 * One font, used by both halves of the pipeline.
 *
 * The layout pass measures text with the browser and the emit pass draws it
 * with jsPDF. Those two only agree if they are using the same font file, so the
 * same base64 TTF is registered with jsPDF and declared as an @font-face in the
 * layout document.
 */

export const PDF_FONT_FAMILY = "WaPdf";

export function registerPdfFont(doc: jsPDF): void {
  // Distinct VFS filenames per weight: writing both to one name leaves jsPDF
  // resolving "normal" to whichever was added last.
  doc.addFileToVFS("WaPdf-normal.ttf", myFont.normal);
  doc.addFont("WaPdf-normal.ttf", PDF_FONT_FAMILY, "normal");

  doc.addFileToVFS("WaPdf-bold.ttf", myFont.bold);
  doc.addFont("WaPdf-bold.ttf", PDF_FONT_FAMILY, "bold");

  doc.setFont(PDF_FONT_FAMILY, "normal");
}

export function pdfFontFaceCss(): string {
  return fontFaceCss(myFont.normal, myFont.bold);
}
