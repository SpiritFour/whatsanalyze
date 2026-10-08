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

/** Whatever was shared, as stored: an analysis snapshot or an AI report. */
export function parseSharedJson(bytes) {
  // Decoded here rather than through pako's `to: "string"`, which hands back
  // raw bytes on this version and would mangle every emoji even if it did not.
  return JSON.parse(new TextDecoder().decode(inflate(bytes)));
}

export function parseSharePayload(bytes) {
  return reviveSnapshot(parseSharedJson(bytes));
}

/** An analysis snapshot, checked and with its dates turned back into Dates. */
export function reviveSnapshot(snapshot) {
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

const ID_BYTES = 16;
const IV_BYTES = 12;
const KEY_BYTES = 32;

/** The document id, the nonce and the key, in that order. */
export const SHARE_TOKEN_BYTES = ID_BYTES + IV_BYTES + KEY_BYTES;

/**
 * One opaque token in the URL fragment, which browsers never send: not to the
 * host, not in a Referer, not in the page URL analytics records.
 *
 * The three pieces used to travel as named query parameters holding JSON
 * arrays of decimal numbers, percent-encoded -- which spent 245 characters on
 * 60 bytes. Concatenated and written as base64url they take 80, and the link
 * reads as one blob rather than as a form submission.
 */
export function encodeShareToken({ id, iv, key }) {
  const token = new Uint8Array(SHARE_TOKEN_BYTES);
  token.set(new Uint8Array(id), 0);
  token.set(new Uint8Array(iv), ID_BYTES);
  token.set(new Uint8Array(key), ID_BYTES + IV_BYTES);
  return bytesToBase64Url(token);
}

export function decodeShareToken(fragment) {
  const bytes = base64UrlToBytes(String(fragment).replace(/^#/, ""));
  if (bytes.length !== SHARE_TOKEN_BYTES) {
    throw new Error("Incomplete share link");
  }
  return {
    id: bytes.slice(0, ID_BYTES),
    iv: bytes.slice(ID_BYTES, ID_BYTES + IV_BYTES),
    key: bytes.slice(ID_BYTES + IV_BYTES).buffer,
  };
}

/**
 * No UTM tags: /s exists for nothing but share links, so the visit is already
 * known to be one by the time the page reports it, and 38 characters of query
 * string bought nothing the page could not say itself.
 */
export function buildShareLinkUrl(origin, path, token) {
  const base = String(origin).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}#${token}`;
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

/** base64url: the URL-safe alphabet, and no `=` padding to percent-encode. */
export function bytesToBase64Url(bytes) {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlToBytes(text) {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  return base64ToBytes(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
}
