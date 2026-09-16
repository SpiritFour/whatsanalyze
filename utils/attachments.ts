import * as JSZip from "jszip";

export enum MimeTypeGroup {
  image,
  video,
  audio,
  other,
}

interface MimeTypeData {
  mimeType: string | undefined;
  mimeTypeGroup: MimeTypeGroup;
  mimeTypeEnding: string;
  renderInPDF: boolean;
}
export interface Attachment {
  mimeTypeData: MimeTypeData;
  src?: Uint8Array;
  fileName: string;
  width?: number;
  height?: number;
}

export interface AttachmentSource {
  name: string;
  // The JSZip entry itself, so media is only decompressed once it is rendered.
  zipEntry?: JSZip.JSZipObject;
  // Set instead of `zipEntry` when a plain list of files was uploaded.
  decompressedData?: Uint8Array;
}

function getMimeType(fileName: string): MimeTypeData {
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

async function renderAttachment(
  fileName: string,
  attachmentData?: Uint8Array
): Promise<Attachment> {
  // if the attachmentData is null (because we were not able to find the file)
  // we set the mimetype to the same format as an unknown file
  const mimeTypeData: MimeTypeData = attachmentData
    ? getMimeType(fileName)
    : {
        mimeTypeGroup: MimeTypeGroup.other,
        mimeTypeEnding: fileName.split(".").pop() || "",
        mimeType: MimeTypeGroup.other + "/" + fileName.split(".").pop(),
        renderInPDF: false,
      };

  let width, height;
  if (mimeTypeData.mimeTypeGroup === MimeTypeGroup.image && attachmentData) {
    // some WhatsApp exports carry odd endings (e.g. `.jpe`) — always hand the
    // decoder a real image mime so createImageBitmap can sniff the container
    const blob = new Blob([attachmentData], {
      type: mimeTypeData.mimeTypeEnding === "png" ? "image/png" : "image/jpeg",
    });

    // Decode failures (corrupt/heic/etc.) must not take down the whole PDF run:
    // fall back to renderInPDF=false so the message still renders as text.
    try {
      const bitmap = await createImageBitmap(blob);
      (width = bitmap.width), (height = bitmap.height);
    } catch (error) {
      console.error("Attachment image decode failed for", fileName, error);
      mimeTypeData.renderInPDF = false;
    }
  }

  return {
    mimeTypeData,
    src: attachmentData,
    fileName: fileName,
    width,
    height,
  };
}

// gets attachment mimeType, src, and filename from attachments
export async function getAttachment(
  fileName: string,
  attachments: AttachmentSource[]
): Promise<Attachment> {
  // potentially this finds files that are a false match
  // but there is the case that the images are in the "zip" folder, so we need
  // to be sure to find em

  const data = attachments.filter((file) =>
    RegExp(".*" + fileName).test(file.name)
  );

  if (data.length === 0) {
    // sometimes we can not find the attachment
    return renderAttachment(fileName);
  }

  // `async` reads both deflated and stored entries. WhatsApp stores media
  // uncompressed because it is already compressed, and a raw inflate over
  // those bytes fails with "Error inflating data: invalid block type".
  const decompressedData = data[0].zipEntry
    ? await data[0].zipEntry.async("uint8array")
    : data[0].decompressedData;

  return renderAttachment(fileName, decompressedData);
}
