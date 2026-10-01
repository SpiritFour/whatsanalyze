import { deflate, inflate } from "pako";

import { SNAPSHOT_VERSION } from "~/utils/social/analysisSnapshot";

export const SHARE_PAYLOAD_VERSION = SNAPSHOT_VERSION;

/**
 * A Firestore document holds a megabyte, and the payload below is base64, so
 * this is the budget it has to come in under. A snapshot is a few tens of
 * kilobytes whatever the chat's size, so nothing real comes near it -- the
 * check is here to fail clearly rather than as a Firestore error if some
 * pathological chat ever did.
 */
export const SHARE_SIZE_LIMIT = 1_000_000;

export class ChatTooLargeError extends Error {
  constructor(size) {
    super(
      `Analysis is ${size} bytes once packed, over the ${SHARE_SIZE_LIMIT} limit`,
    );
    this.name = "ChatTooLargeError";
    this.size = size;
  }
}

/** Dates do not survive JSON, and the charts call Date methods on these. */
const DATE_FIELDS = ["firstDate", "lastDate"];

export function buildSharePayload(snapshot) {
  return deflate(new TextEncoder().encode(JSON.stringify(snapshot)));
}

export function parseSharePayload(bytes) {
  // Decoded here rather than through pako's `to: "string"`, which hands back
  // raw bytes on this version and would mangle every emoji even if it did not.
  const snapshot = JSON.parse(new TextDecoder().decode(inflate(bytes)));

  if (snapshot.version !== SHARE_PAYLOAD_VERSION) {
    throw new Error(`Unsupported share payload version ${snapshot.version}`);
  }
  if (!snapshot.socialStats || !Array.isArray(snapshot.people)) {
    throw new Error("Share payload has no analysis");
  }

  DATE_FIELDS.forEach((field) => {
    if (snapshot[field]) snapshot[field] = new Date(snapshot[field]);
  });
  snapshot.socialStats.start = new Date(snapshot.socialStats.start);
  snapshot.socialStats.end = new Date(snapshot.socialStats.end);

  return snapshot;
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
