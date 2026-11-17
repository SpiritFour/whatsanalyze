import {
  hasShareInfo,
  parseShareInfo,
  serializeShareInfo,
} from "~/utils/wrapped/sharing/param";

const uuid = "3f2b8c1e-7a4d-4e9b-9c55-0d1e2f3a4b5c";
// Every byte value that base64 spells with "+", "/" or padding.
const iv = [251, 255, 190, 0, 1, 2, 62, 63, 250, 9, 10, 11];
const key = Uint8Array.from({ length: 32 }, (_, i) => (i * 37 + 251) % 256);
const shareInfo = { uuid, encryptedKey: { iv, key: key.buffer } };

describe("share link fragment", () => {
  test("round-trips the id, the iv and the key", () => {
    const parsed = parseShareInfo(serializeShareInfo(shareInfo));
    expect(parsed.uuid).toBe(uuid);
    expect(parsed.encryptedKey.iv).toEqual(iv);
    expect(Array.from(new Uint8Array(parsed.encryptedKey.key))).toEqual(
      Array.from(key),
    );
  });

  test("is short and needs no percent-encoding", () => {
    const fragment = serializeShareInfo(shareInfo);
    expect(fragment.length).toBeLessThan(110);
    expect(fragment).toMatch(/^s=[A-Za-z0-9._-]+$/);
    expect(encodeURIComponent(fragment.slice(2))).toBe(fragment.slice(2));
  });

  test("reads it with the leading # of location.hash", () => {
    const parsed = parseShareInfo(`#${serializeShareInfo(shareInfo)}`);
    expect(parsed.uuid).toBe(uuid);
  });

  test("still reads a link made in the first format", () => {
    const legacy = new URLSearchParams({
      uuid,
      iv: JSON.stringify(iv),
      key: JSON.stringify(Array.from(key)),
    }).toString();
    expect(hasShareInfo(legacy)).toBe(true);
    const parsed = parseShareInfo(legacy);
    expect(parsed.uuid).toBe(uuid);
    expect(parsed.encryptedKey.iv).toEqual(iv);
    expect(Array.from(new Uint8Array(parsed.encryptedKey.key))).toEqual(
      Array.from(key),
    );
  });

  test("tells a story link from any other fragment", () => {
    expect(hasShareInfo(`#${serializeShareInfo(shareInfo)}`)).toBe(true);
    expect(hasShareInfo("")).toBe(false);
    expect(hasShareInfo("#features")).toBe(false);
    expect(hasShareInfo("#s=only.two")).toBe(false);
    expect(hasShareInfo("#uuid=abc")).toBe(false);
  });

  test("refuses a link with a part missing", () => {
    expect(() => parseShareInfo("#s=a..c")).toThrow();
    expect(() => parseShareInfo("#uuid=abc")).toThrow();
    expect(() => parseShareInfo("")).toThrow();
  });
});
