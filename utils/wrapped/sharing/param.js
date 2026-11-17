/**
 * The part of a share link that says which story and how to read it: the
 * document's id and the key it was encrypted with. It travels in the URL's
 * fragment, which browsers never send to a server.
 *
 * Written compactly (`s=<id>.<iv>.<key>`, base64url) since the link is what
 * lands in a WhatsApp chat: the first format spelled the key out as a JSON
 * list of numbers, which percent-encoded to some 350 characters of %5B and
 * %2C. Links in that format are still read.
 *
 * @typedef {import("./firestore").ShareInfo} ShareInfo
 */

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (text) => {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const paramsOf = (fragment) =>
  new URLSearchParams(String(fragment ?? "").replace(/^[#?]/, ""));

/** @param {ShareInfo} shareInfo */
export function serializeShareInfo(shareInfo) {
  const { uuid, encryptedKey } = shareInfo;
  const iv = toBase64Url(Uint8Array.from(encryptedKey.iv));
  const key = toBase64Url(new Uint8Array(encryptedKey.key));
  return `s=${uuid}.${iv}.${key}`;
}

/** Whether a URL fragment (or query string) carries a story to open. */
export function hasShareInfo(fragment) {
  const params = paramsOf(fragment);
  if (params.get("s")) return params.get("s").split(".").length === 3;
  return Boolean(params.get("uuid") && params.get("iv") && params.get("key"));
}

/**
 * @param {string} fragment The link's fragment, with or without its "#".
 * @returns {ShareInfo}
 */
export function parseShareInfo(fragment) {
  const params = paramsOf(fragment);

  const compact = params.get("s");
  if (compact) {
    const [uuid, iv, key] = compact.split(".");
    if (!uuid || !iv || !key) throw new Error("Invalid share link");
    return {
      uuid,
      encryptedKey: {
        iv: Array.from(fromBase64Url(iv)),
        key: fromBase64Url(key).buffer,
      },
    };
  }

  // Links made before the compact format.
  const uuid = params.get("uuid");
  if (!uuid) {
    throw new Error("Invalid UUID");
  }
  const ivStr = params.get("iv");
  const keyStr = params.get("key");
  if (!ivStr || !keyStr) {
    throw new Error("Invalid ShareableKey");
  }
  return {
    uuid,
    encryptedKey: {
      iv: JSON.parse(ivStr),
      key: new Uint8Array(JSON.parse(keyStr)).buffer,
    },
  };
}
