import { gzip, ungzip } from "pako";

/**
 * A saved chat's messages, one record per month (docs/saved-chats.md, "Why
 * months"): an update rewrites only the months it touches, the over-time
 * views read one small record a month, and a long chat can open on its
 * latest months first.
 *
 * Messages are stored as `ChatMessage` (composables/useChatTool.ts) with the
 * date as a number, and revived on the way out the way utils/chatSession.ts
 * does it. Attachments keep only their file name: the media stays in the
 * export, which is never kept here.
 */

/**
 * The month a message belongs to, as "YYYY-MM". Local time, like the parser:
 * WhatsApp's timestamps carry no time zone and are read as local time, so this
 * is the month the message's own date line in the export says.
 */
export const monthKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * A message as it is stored: only the fields a ChatMessage has, so nothing an
 * analyzer hangs on a message on screen ends up in the database, and the
 * date as milliseconds.
 */
export function toStored(message, index) {
  const date =
    message.date instanceof Date
      ? message.date.getTime()
      : new Date(message.date).getTime();
  const stored = {
    date,
    author: message.author,
    message: message.message,
    absolute_id: message.absolute_id ?? index,
  };
  if (message.attachment?.fileName) {
    stored.attachment = { fileName: message.attachment.fileName };
  }
  return stored;
}

/**
 * Stored messages back to ChatMessages. JSON has no date type, and the
 * analyzer calls Date methods on every message, so a date that does not come
 * back means the whole chat is unreadable rather than quietly wrong.
 */
export function revive(stored) {
  return stored.map((message) => {
    const date = new Date(message.date);
    if (Number.isNaN(date.getTime())) {
      throw new Error("A saved message has an unreadable date.");
    }
    return { ...message, date };
  });
}

/** Stored messages grouped by month, each month in the export's order. */
export function bucketByMonth(stored) {
  const months = new Map();
  for (const message of stored) {
    if (!Number.isFinite(message.date)) continue;
    const key = monthKey(message.date);
    let bucket = months.get(key);
    if (!bucket) months.set(key, (bucket = []));
    bucket.push(message);
  }
  return months;
}

/** One month as it goes into the database: JSON, gzipped. */
export function packMonth(chatId, month, stored) {
  return {
    chatId,
    month,
    count: stored.length,
    // Encoded and decoded by hand: pako's string options hand back raw bytes
    // on this version and would mangle every emoji (see utils/social/shareLink.js).
    data: gzip(new TextEncoder().encode(JSON.stringify(stored))),
  };
}

/** A chat's month records back to its stored messages, in the export's order. */
export function unpackMonths(records) {
  const stored = [];
  for (const record of records) {
    const month = JSON.parse(new TextDecoder().decode(ungzip(record.data)));
    for (const message of month) stored.push(message);
  }
  // Months come back in key order, which is the order of the dates. The
  // export's own order is kept in `absolute_id`, and a phone whose clock
  // jumped can put a message's date before the one above it.
  return stored.sort((a, b) => a.absolute_id - b.absolute_id);
}
