export class MimeTypeGroup {
  static image = "image";
  static video = "video";
  static audio = "audio";
  static other = "other";
}

function getMimeType(fileName) {
  function _internal() {
    if (/\.jpe?g$/.test(fileName) || fileName.endsWith(".png")) {
      return {
        mimeTypeGroup: MimeTypeGroup.image,
        renderInPDF: true,
      };
    }
    if (
      fileName.endsWith(".gif") ||
      fileName.endsWith(".webp") ||
      fileName.endsWith(".svg")
    ) {
      return { mimeTypeGroup: MimeTypeGroup.image, renderInPDF: false };
    }

    if (fileName.endsWith(".mp4") || fileName.endsWith(".webm")) {
      return { mimeTypeGroup: MimeTypeGroup.audio, renderInPDF: false };
    }
    if (
      fileName.endsWith(".mp3") ||
      fileName.endsWith(".m4a") ||
      fileName.endsWith(".opus") ||
      fileName.endsWith(".wav")
    ) {
      return { mimeTypeGroup: MimeTypeGroup.audio, renderInPDF: false };
    }
    // unknown file
    return { mimeTypeGroup: MimeTypeGroup.other, renderInPDF: false };
  }

  const internalData = _internal();
  const mimeTypeEnding = fileName.split(".").pop() || "";
  return {
    mimeTypeEnding,
    ...internalData,
    mimeType: internalData.mimeTypeGroup + "/" + mimeTypeEnding,
  };
}

function renderAttachment(fileName, attachmentData) {
  // if the attachmentData is null (because we were not able to find the file)
  // we set the mimetype to the same format as an unknown file
  const mimeTypeData = attachmentData
    ? getMimeType(fileName)
    : {
        mimeTypeGroup: MimeTypeGroup.other,
        mimeTypeEnding: fileName.split(".").pop() || "",
        mimeType: MimeTypeGroup.other + "/" + fileName.split(".").pop(),
        renderInPDF: false,
      };

  return {
    mimeTypeData,
    src: "data:" + mimeTypeData.mimeType + ";base64, " + attachmentData,
    fileName: fileName.split("-")[1],
  };
}

// gets attachment mimeType, src, and filename from attachments
export async function getAttachment(fileName, attachments) {
  // potentially this finds files that are a false match
  // but there is the case that the images are in the "zip" folder, so we need
  // to be sure to find em
  const data = await attachments
    .file(RegExp(".*" + fileName))[0]
    ?.async("base64");
  return renderAttachment(fileName, data);
}
