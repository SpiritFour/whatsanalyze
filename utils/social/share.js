import JSZip from "jszip";
import { downloadBase64File } from "~/utils/utils";

const SHARE_BASE = "https://whatsanalyze.com";

/**
 * Every link that leaves a share card carries UTM parameters so we can tell
 * how much traffic the cards bring back. `medium` says which surface the link
 * was placed on (the printed QR code, the WhatsApp CTA, the native sheet, ...).
 */
export function buildShareUrl(medium = "card") {
  return `${SHARE_BASE}?utm_source=user_share&utm_medium=${medium}`;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode the card as an image."));
    }, "image/png");
  });
}

export function canShareFiles() {
  if (typeof navigator === "undefined") return false;
  if (!navigator.share || !navigator.canShare) return false;
  try {
    return navigator.canShare({
      files: [new File([], "card.png", { type: "image/png" })],
    });
  } catch (_error) {
    return false;
  }
}

export function canCopyImages() {
  return (
    typeof window !== "undefined" &&
    typeof window.ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.clipboard?.write
  );
}

/**
 * Opens the native share sheet with the card attached. Resolves to false when
 * the user dismisses the sheet so callers can stay quiet about it.
 */
export async function shareCanvas(canvas, { fileName, title, text }) {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], fileName, { type: "image/png" });

  let payload = { title, text, files: [file] };
  if (navigator.canShare && !navigator.canShare(payload)) {
    payload = { title, files: [file] };
  }

  try {
    await navigator.share(payload);
    return true;
  } catch (error) {
    if (error?.name === "AbortError") return false;
    throw error;
  }
}

export async function copyCanvasToClipboard(canvas) {
  const blob = await canvasToBlob(canvas);
  await navigator.clipboard.write([
    new window.ClipboardItem({ "image/png": blob }),
  ]);
}

export function downloadCanvas(canvas, fileName) {
  downloadBase64File(canvas, fileName);
}

export async function downloadCardsZip(entries, zipName) {
  const zip = new JSZip();
  for (const { canvas, fileName } of entries) {
    zip.file(fileName, await canvasToBlob(canvas));
  }
  const archive = await zip.generateAsync({ type: "blob" });
  downloadBase64File(archive, zipName);
}

export function openWhatsAppShare(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}
