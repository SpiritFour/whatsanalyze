function getMimeType(fileName) {
  if (/\.jpe?g$/.test(fileName)) return "image/jpeg";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".gif")) return "image/gif";
  if (fileName.endsWith(".webp")) return "image/webp";
  if (fileName.endsWith(".svg")) return "image/svg+xml";

  if (fileName.endsWith(".mp4")) return "video/mp4";
  if (fileName.endsWith(".webm")) return "video/webm";

  if (fileName.endsWith(".mp3")) return "audio/mpeg";
  if (fileName.endsWith(".m4a")) return "audio/mp4";
  if (fileName.endsWith(".wav")) return "audio/wav";
  if (fileName.endsWith(".opus")) return "audio/ogg";
  return fileName.split(".").splice(-1)[0];
}

function renderAttachment(fileName, attachment) {
  const mimeType = getMimeType(fileName) || "";
  const src = "data:" + mimeType + ";base64, " + attachment;
  return { mimeType: mimeType, src: src, fileName: fileName.split("-")[1] };
}

// gets attachment mimeType, src, and filename from attachments
export async function getAttachment(fileName, attachments) {
  let data = await attachments.file(fileName).async("base64");
  return renderAttachment(fileName, data);
}
