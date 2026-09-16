/* eslint-env jest */
import JSZip from "jszip";
import { getAttachment } from "./attachments";

// A minimal but real JPEG header. Its first byte is 0xFF, whose low bits are
// the deflate block-type field `11` (reserved) -- raw-inflating a stored entry
// that starts this way is what produced "Error inflating data: invalid block
// type" in production.
const JPEG_BYTES = new Uint8Array([
  0xff,
  0xd8,
  0xff,
  0xe0,
  0x00,
  0x10,
  0x4a,
  0x46,
  0x49,
  0x46,
  0x00,
  0x01,
  0x01,
  0x00,
  0x00,
  0x01,
  0x00,
  0x01,
  0x00,
  0x00,
]);

/** Builds a zip and hands back its entries the way FileHandler does. */
async function zipToSources(files) {
  const zip = new JSZip();
  for (const { name, data, compression } of files) {
    zip.file(name, data, { compression });
  }
  const loaded = await JSZip.loadAsync(
    await zip.generateAsync({ type: "uint8array" })
  );
  return Object.values(loaded.files).map((file) => ({
    name: file.name,
    zipEntry: file,
  }));
}

describe("getAttachment", () => {
  it("reads media that WhatsApp stored uncompressed", async () => {
    // WhatsApp stores photos and videos with compression method 0, because
    // they are already compressed.
    const sources = await zipToSources([
      {
        name: "IMG-20260905-WA0001.jpg",
        data: JPEG_BYTES,
        compression: "STORE",
      },
    ]);

    const attachment = await getAttachment("IMG-20260905-WA0001.jpg", sources);

    expect(attachment.src).toEqual(JPEG_BYTES);
    expect(attachment.fileName).toBe("IMG-20260905-WA0001.jpg");
  });

  it("reads deflated entries", async () => {
    const text = Uint8Array.from("x".repeat(500), (c) => c.charCodeAt(0));
    const sources = await zipToSources([
      { name: "notes.txt", data: text, compression: "DEFLATE" },
    ]);

    const attachment = await getAttachment("notes.txt", sources);

    expect(attachment.src).toEqual(text);
  });

  it("falls back to a plain file list when there is no zip entry", async () => {
    const data = new Uint8Array([1, 2, 3]);

    const attachment = await getAttachment("shared.jpg", [
      { name: "shared.jpg", decompressedData: data },
    ]);

    expect(attachment.src).toEqual(data);
  });

  it("still returns an attachment when the file is missing", async () => {
    const attachment = await getAttachment("gone.jpg", []);

    expect(attachment.src).toBeUndefined();
    expect(attachment.fileName).toBe("gone.jpg");
    expect(attachment.mimeTypeData.renderInPDF).toBe(false);
  });
});
