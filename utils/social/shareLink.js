import { deflate, inflate } from "pako";

export const SHARE_PAYLOAD_VERSION = 3;

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
 * What a share link carries: the source messages, and only the source. Every
 * chart, every fun fact and every highlight is derived from these on the other
 * side, exactly as it is after an upload, so the two cannot drift.
 *
 * Stored column by column rather than as one object per message. A message is
 * mostly repetition -- the same four field names, the same handful of authors,
 * timestamps a few minutes apart -- and spelling that out per message made the
 * payload twice the size of the chat export it came from. Here each field name
 * appears once in the whole document, authors become an index into a table,
 * and timestamps are the gap since the previous message. `absolute_id` is not
 * stored at all: it is the position in the export, which is the array index.
 *
 * Deflated before encryption, because ciphertext is noise and will not
 * compress afterwards.
 */
export function buildSharePayload(messages) {
  const authors = [...new Set(messages.map((message) => message.author))];
  const authorIndex = new Map(authors.map((author, index) => [author, index]));

  const base = messages.length ? messages[0].date.getTime() : 0;
  let previous = base;
  const gaps = [];
  const attachments = {};

  messages.forEach((message, index) => {
    const time = message.date.getTime();
    gaps.push(time - previous);
    previous = time;
    if (message.attachment?.fileName) {
      attachments[index] = message.attachment.fileName;
    }
  });

  return deflate(
    new TextEncoder().encode(
      JSON.stringify({
        version: SHARE_PAYLOAD_VERSION,
        authors,
        who: messages.map((message) => authorIndex.get(message.author)),
        base,
        gaps,
        texts: messages.map((message) => message.message),
        attachments,
      }),
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
  if (!Array.isArray(payload.texts) || !payload.texts.length) {
    throw new Error("Share payload has no messages");
  }

  let time = payload.base;
  return payload.texts.map((message, index) => {
    time += payload.gaps[index];
    const fileName = payload.attachments?.[index];
    return {
      // A real Date: everything downstream calls Date methods on this, and a
      // string would throw on the first chart.
      date: new Date(time),
      author: payload.authors[payload.who[index]],
      message,
      absolute_id: index,
      ...(fileName ? { attachment: { fileName } } : {}),
    };
  });
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
