import { deflate, inflate } from "pako";

export const SHARE_PAYLOAD_VERSION = 2;

/**
 * A Firestore document holds a megabyte. The payload below is base64, so this
 * is the budget the compressed chat has to come in under, with a little room
 * left for the field name and the document path.
 */
export const SHARE_SIZE_LIMIT = 1_000_000;

export class ChatTooLargeError extends Error {
  constructor(size) {
    super(
      `Chat is ${size} bytes once packed, over the ${SHARE_SIZE_LIMIT} limit`,
    );
    this.name = "ChatTooLargeError";
    this.size = size;
  }
}

/**
 * What a share link carries: the parsed messages, exactly as they came back
 * from the upload. The page behind the link builds its Chat from these and
 * renders the ordinary analysis, so a shared link and an upload cannot drift.
 *
 * Deflated before encryption rather than after -- ciphertext is noise and does
 * not compress -- which is the difference between a chat of forty thousand
 * messages fitting in a document and not.
 */
export function buildSharePayload(messages) {
  return deflate(
    new TextEncoder().encode(
      JSON.stringify({ version: SHARE_PAYLOAD_VERSION, messages }),
    ),
  );
}

export function parseSharePayload(bytes) {
  // Decoded here rather than through pako's `to: "string"`, which hands back
  // raw bytes on this version and would mangle every emoji even if it did not.
  const payload = JSON.parse(new TextDecoder().decode(inflate(bytes)));
  if (payload.version !== SHARE_PAYLOAD_VERSION) {
    throw new Error(`Unsupported share payload version ${payload.version}`);
  }
  if (!Array.isArray(payload.messages) || !payload.messages.length) {
    throw new Error("Share payload has no messages");
  }
  // JSON has no date type. Everything downstream calls Date methods on this,
  // and a string would throw on the first chart.
  return payload.messages.map((message) => ({
    ...message,
    date: new Date(message.date),
  }));
}

/**
 * The uuid, iv and key go in the URL fragment, which browsers never send: not
 * to the host, not in a Referer, not in the page URL analytics records. Only
 * the UTM tags stay in the query, so the visit still counts as its own source.
 */
export function serializeShareInfo({ uuid, encryptedKey }) {
  const params = new URLSearchParams();
  params.set("uuid", uuid);
  params.set("iv", JSON.stringify(encryptedKey.iv));
  params.set(
    "key",
    JSON.stringify(Array.from(new Uint8Array(encryptedKey.key))),
  );
  return params.toString();
}

export function parseShareInfo(fragment) {
  const params = new URLSearchParams(String(fragment).replace(/^#/, ""));
  const uuid = params.get("uuid");
  const iv = params.get("iv");
  const key = params.get("key");
  if (!uuid || !iv || !key) throw new Error("Incomplete share link");

  return {
    uuid,
    encryptedKey: {
      iv: JSON.parse(iv),
      key: new Uint8Array(JSON.parse(key)).buffer,
    },
  };
}

export function buildShareLinkUrl(origin, path, fragment) {
  const base = String(origin).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}?utm_source=user_share&utm_medium=link#${fragment}`;
}

/**
 * Base64 in fixed slices. Spreading a megabyte of bytes into
 * String.fromCharCode at once overflows the call stack.
 */
export function bytesToBase64(bytes) {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
