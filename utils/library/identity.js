import { SYSTEM_AUTHOR } from "~/utils/systemMessages";

/**
 * Telling saved chats apart: which chat a set of messages is, what it is
 * called, and who is in it. No database here, so the pages can ask without
 * loading the library.
 */

const MINUTE = 60_000;

const timeOf = (date) =>
  typeof date === "number" ? date : new Date(date).getTime();

/**
 * A 64-bit hash of text fed to it piece by piece: cyrb53's mixing, both
 * halves kept. Not cryptographic, and it doesn't need to be: it tells a
 * visitor's own few chats apart.
 */
function hasher() {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  return {
    feed(text) {
      for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
    },
    digest() {
      const a =
        Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
        Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      const b =
        Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
        Math.imul(a ^ (a >>> 13), 3266489909);
      return (
        (b >>> 0).toString(16).padStart(8, "0") +
        (a >>> 0).toString(16).padStart(8, "0")
      );
    },
  };
}

/** A short, stable stand-in for a longer text, e.g. which reading a coach conversation belongs to. */
export function hashText(text) {
  const hash = hasher();
  hash.feed(String(text ?? ""));
  return hash.digest();
}

/**
 * Which chat these messages are, as far as an identical copy goes: who wrote
 * each message, to the minute, in order, participant messages only.
 *
 * What the messages say is left out on purpose. The same chat exported with
 * media reads "<attached: 00000012-PHOTO….jpg>" where the export without it
 * reads "image omitted", in the exporting phone's language, and WhatsApp's own
 * notices change with that language too. Minutes, because Android exports
 * have no seconds. Two different chats with the same author at the same
 * minute for every one of their messages do not happen.
 *
 * Step 3 matches newer exports of a chat too; this only recognizes the same
 * one again.
 */
export function streamKey(messages) {
  const hash = hasher();
  let count = 0;
  for (const message of messages) {
    if (message.author === SYSTEM_AUTHOR) continue;
    const time = timeOf(message.date);
    if (!Number.isFinite(time)) continue;
    count++;
    hash.feed(`${Math.floor(time / MINUTE)}\u0001${message.author}\n`);
  }
  return `${count}-${hash.digest()}`;
}

/**
 * What the list shows about a chat, worked out from its messages: people by
 * how much they wrote, the first and last participant message, the counts.
 */
export function summarize(messages) {
  const perPerson = new Map();
  let first = Infinity;
  let last = -Infinity;
  let attachments = 0;
  let participantMessages = 0;

  for (const message of messages) {
    if (message.attachment?.fileName) attachments++;
    if (message.author === SYSTEM_AUTHOR) continue;
    const time = timeOf(message.date);
    if (!Number.isFinite(time)) continue;
    participantMessages++;
    perPerson.set(message.author, (perPerson.get(message.author) ?? 0) + 1);
    if (time < first) first = time;
    if (time > last) last = time;
  }

  const participants = [...perPerson]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);

  return {
    participants,
    messages: participantMessages,
    total: messages.length,
    attachments,
    firstDate: participantMessages ? first : null,
    lastDate: participantMessages ? last : null,
    streamKey: streamKey(messages),
  };
}

/**
 * "WhatsApp Chat with Anna", "WhatsApp Chat - Anna" and the other languages
 * WhatsApp names its exports in (Android names the .txt, iOS the .zip).
 */
const EXPORT_NAME =
  /^(?:whatsapp[ -]?chat|chat de whatsapp|conversa d[eo] whatsapp|discussion whatsapp|chat (?:di |de )?whatsapp)\s*(?:-|–|with|mit|con|com|avec)\s+/i;

/**
 * Names that say nothing about who the chat is with: "_chat", or a file named
 * only with words like these ("chat_example", "chat-export-2024"), which
 * would otherwise turn up on a landing page as "your chat with chat_example".
 */
const GENERIC_NAME =
  /^[\s_.-]*(?:(?:whatsapp|chat|export|example|backup|\d+)[\s_.-]*)+$/i;

/**
 * What a chat is called in "Your chats": the contact or group the export is
 * named after, or null when the file name says nothing ("_chat.txt"), so the
 * list names the people instead.
 */
export function chatTitle(fileName) {
  if (!fileName) return null;
  const base = String(fileName)
    .replace(/\.(?:zip|txt)$/i, "")
    // A second download of the same export: "… (2).zip"
    .replace(/\s*\(\d+\)$/, "")
    .trim();
  const name = base.replace(EXPORT_NAME, "").trim();
  if (!name || GENERIC_NAME.test(name)) return null;
  return name.slice(0, 80);
}

/** What a backup file is called, so it says what it is in a downloads folder. */
export const backupFileName = (now = Date.now()) =>
  `whatsanalyze-backup-${new Date(now).toISOString().slice(0, 10)}.json.gz`;

/**
 * Could this file be a backup (backup.js)? Decided by name, before reading a
 * byte, and here rather than there so a drop handler can ask without loading
 * gzip: a dropped chat export is a .txt or .zip and goes to the parser as
 * before. Safari unpacks a downloaded .gz on its own, so the .json it leaves
 * counts too.
 */
export const isBackupName = (name) =>
  /^whatsanalyze-backup.*\.json(?:\.gz)?$/i.test(name ?? "");
