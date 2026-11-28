/**
 * Printing a finished PDF, the same way from every page that offers it (the
 * analyzer's and the tool's download section, PdfDownloadPopup.vue).
 *
 * Printing the PDF rather than the page means it looks the same from every
 * browser; printing a page through CSS is at the mercy of each engine.
 *
 * Desktop browsers print it from a hidden frame. Safari (macOS, and every
 * browser on iOS) prints a PDF from a frame as a blank page, if at all, so
 * there it is opened instead. On iPhone and iPad a tab opened before the PDF
 * is made stays blank until the visitor switches away and back, and one
 * opened after it is made is blocked as a popup, because the tap no longer
 * counts. So there the first tap makes the PDF and a second, fresh tap
 * hands it over (`openPreparedPdf`): to the share sheet, which has Print,
 * else to a new tab.
 */

const FRAME_ID = "pdf-print-frame";

export function isIOS(): boolean {
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Where a PDF cannot be printed from a frame, and is opened instead. */
export function opensPdfInTab(): boolean {
  const ua = navigator.userAgent;
  const safari =
    /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  return isIOS() || safari;
}

export function removePrintFrame(): void {
  document.getElementById(FRAME_ID)?.remove();
}

/** The browser's print dialog for the PDF at `url`, from a hidden frame. */
export function printInFrame(url: string): void {
  removePrintFrame();
  const frame = document.createElement("iframe");
  frame.id = FRAME_ID;
  frame.setAttribute("aria-hidden", "true");
  // Off screen rather than hidden: a hidden frame never loads the PDF viewer.
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.addEventListener("load", () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(url, "_blank");
    }
  });
  frame.src = url;
  document.body.appendChild(frame);
}

/** Hands a PDF made earlier over, on a fresh tap (see above). */
export async function openPreparedPdf(
  blob: Blob,
  url: string,
  fileName: string,
): Promise<void> {
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (isIOS() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      // dismissed: nothing to do; anything else: open it instead
      if ((error as Error)?.name === "AbortError") return;
    }
  }
  window.open(url, "_blank");
}
