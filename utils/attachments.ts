import * as JSZip from "jszip";
import pako from "pako";

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
    // Create a blob from the uint8array data
    const blob = new Blob([attachmentData], {
      type: getMimeType(fileName).mimeType,
    });

    // Create a bitmap image from the blob data
    const bitmap = await createImageBitmap(blob);
    (width = bitmap.width), (height = bitmap.height);
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
  attachments: Array<{
    name: string;
    compressedContent?: Uint8Array;
    decompressedData?: Uint8Array;
  }>
): Promise<Attachment> {
  // potentially this finds files that are a false match
  // but there is the case that the images are in the "zip" folder, so we need
  // to be sure to find em

  const data: any = attachments.filter((file) =>
    RegExp(".*" + fileName).test(file.name)
  );

  if (data.length === 0) {
    // sometimes we can not find the attachment
    return renderAttachment(fileName);
  }
  let decompressedData;

  if (data[0].compressedContent) {
    // this means we have a zip file and have to inflate it frrst
    decompressedData = inflate(data[0]);
  } else {
    // this means a list of files was uploaded
    decompressedData = data[0].decompressedData;
  }

  return renderAttachment(fileName, decompressedData);
}

// this functions inflates ziped files
function inflate(data: any) {
  const inflater = new pako.Inflate({ raw: true });
  const chunkSize = 1024; // adjust as needed
  let offset = 0;

  // needed to unkompress this by hand
  const compressedData = data.compressedContent;
  while (offset < compressedData.length) {
    const end = Math.min(offset + chunkSize, compressedData.length);
    const chunk = compressedData.subarray(offset, end);
    inflater.push(chunk);
    offset = end;
  }

  if (inflater.err) {
    throw Error(`Error inflating data: ${inflater.msg}`);
  } else {
    const decompressedData = inflater.result;
    // use uint8 array instead, the width and height can be calculated in the render attachment function
    return decompressedData;
  }
}
