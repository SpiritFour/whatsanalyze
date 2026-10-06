import { participantMessages } from "~/utils/utils";

/**
 * Reduce a chat to what an AI analysis is allowed to see.
 *
 * Runs in the browser for both the on-device and the cloud model, so the cloud
 * only ever receives this: excerpts sampled across the whole chat, with every
 * participant renamed to a placeholder and phone numbers, emails and links
 * blanked. The placeholders map back to the real names on the device
 * (`restoreNames`), so the answer still reads "Anna", without the cloud ever
 * having been told who Anna is.
 */

/** Messages in one excerpt. Long enough to follow a conversation. */
const WINDOW = 20;
/** A single message is cut here, so one wall of text can't eat the budget. */
const MAX_MESSAGE_CHARS = 280;

/** WhatsApp's stand-ins for media, in the languages it exports. */
const MEDIA_PLACEHOLDER =
  /^<.*(omitted|omitido|omis|weggelassen|ausgeschlossen|omessi|ocultad|non inclus|nicht einbezogen)>$|^(image|video|audio|sticker|GIF|document) omitted$/i;

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

const alias = (index) => {
  let label = "";
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Person ${label}`;
};

/** A name as a whole word, in any script: "Ana" must not match "Banana". */
const wholeWord = (name) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${name.replace(ESCAPE, "\\$&")}(?![\\p{L}\\p{N}])`,
    "giu",
  );

const pad = (n) => String(n).padStart(2, "0");
const stamp = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
const day = (d) => stamp(d).slice(0, 10);

/**
 * @param {import("~/composables/useChatTool").ChatMessage[]} messages
 * @param {number} maxChars transcript budget
 * @returns {{ digest: import("~/functions/src/ai/insights").ChatDigest,
 *   names: Record<string, string> }} `names` maps placeholder → real name,
 *   to undo the renaming in the answer.
 */
export function buildDigest(messages, maxChars) {
  const spoken = participantMessages(messages);
  if (!spoken.length) throw new Error("no_messages");

  const counts = new Map();
  for (const m of spoken) counts.set(m.author, (counts.get(m.author) ?? 0) + 1);
  const authors = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const names = {};
  const aliasOf = new Map();
  // Full names first, then first names, so "Anna Schmidt" is replaced whole
  // before "Anna" gets a chance to leave "Person A Schmidt" behind.
  const replacements = [];
  const firstNames = [];
  authors.forEach(([author], i) => {
    const a = alias(i);
    names[a] = author;
    aliasOf.set(author, a);
    replacements.push([wholeWord(author), a]);
    // The full name run together is a handle or a password, never a word:
    // match it anywhere ("janedoe92", "JaneDoeStreet").
    const joined = author.replace(/\s+/g, "");
    if (joined !== author && joined.length >= 6) {
      replacements.push([new RegExp(joined.replace(ESCAPE, "\\$&"), "gi"), a]);
    }
    const first = author.split(/\s+/)[0];
    // A one- or two-letter first name would match half the chat.
    if (first !== author && first.length >= 3 && !/^\+?\d/.test(first)) {
      firstNames.push([wholeWord(first), a]);
    }
  });
  replacements.push(...firstNames);

  const scrub = (text) => {
    let out = text
      .replace(/\u200e/g, "")
      .replace(/https?:\/\/\S+|www\.\S+/gi, "[link]")
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
      // Nine digits or more: a phone number, not a date like 12.10.2026.
      .replace(/\+?\d[\d\s\-/().]{6,}\d/g, (m) =>
        m.replace(/\D/g, "").length >= 9 ? "[phone]" : m,
      );
    for (const [pattern, a] of replacements) out = out.replace(pattern, a);
    out = out.replace(/\s+/g, " ").trim();
    return out.length > MAX_MESSAGE_CHARS
      ? `${out.slice(0, MAX_MESSAGE_CHARS)}…`
      : out;
  };

  const lines = [];
  for (const m of spoken) {
    const text = String(m.message ?? "")
      .replace(/\u200e/g, "")
      .trim();
    if (!text || m.attachment || MEDIA_PLACEHOLDER.test(text)) continue;
    lines.push(`${stamp(m.date)} ${aliasOf.get(m.author)}: ${scrub(text)}`);
  }
  if (!lines.length) throw new Error("no_messages");

  return {
    digest: {
      participants: authors.map(([author, count]) => ({
        alias: aliasOf.get(author),
        messages: count,
      })),
      totalMessages: spoken.length,
      firstDate: day(spoken[0].date),
      lastDate: day(spoken[spoken.length - 1].date),
      transcript: sample(lines, maxChars),
    },
    names,
  };
}

/**
 * Whole conversations from across the chat rather than its first N lines:
 * evenly spaced windows of consecutive messages, the last one always ending
 * on the most recent message.
 */
export function sample(lines, maxChars) {
  const all = lines.join("\n");
  if (all.length <= maxChars) return all;

  const avgLine = all.length / lines.length;
  const windows = Math.max(1, Math.floor(maxChars / (avgLine * WINDOW + 2)));
  const lastStart = Math.max(0, lines.length - WINDOW);
  const starts = Array.from({ length: windows }, (_, i) =>
    windows === 1 ? lastStart : Math.round((lastStart * i) / (windows - 1)),
  );

  // Newest first, so if the estimate overshoots it is the oldest excerpt
  // that is dropped, never the latest.
  const chunks = [];
  let used = 0;
  for (const start of [...new Set(starts)].reverse()) {
    const chunk = lines.slice(start, start + WINDOW).join("\n");
    if (used + chunk.length + 2 > maxChars) continue;
    chunks.unshift(chunk);
    used += chunk.length + 2;
  }
  // A single window bigger than the budget still has to say something.
  if (!chunks.length) return all.slice(all.length - maxChars);
  return chunks.join("\n…\n");
}

/**
 * Put the real names back wherever the model wrote a placeholder — including
 * where it translated "Person" into the language it was asked to answer in.
 */
const PLACEHOLDER = /\b(?:Person|Persona|Personne|Pessoa)\s+([A-Z]{1,2})\b/g;

export function restoreNames(insights, names) {
  const restore = (text) =>
    text.replace(
      PLACEHOLDER,
      (match, label) => names[`Person ${label}`] ?? match,
    );
  return JSON.parse(JSON.stringify(insights), (_key, value) =>
    typeof value === "string" ? restore(value) : value,
  );
}

/**
 * Cut a transcript into consecutive parts of at most `maxChars`, on line
 * boundaries, for a model that cannot read it in one go.
 */
export function splitParts(transcript, maxChars) {
  const parts = [];
  let current = [];
  let size = 0;
  for (const line of transcript.split("\n")) {
    if (size + line.length + 1 > maxChars && current.length) {
      parts.push(current.join("\n"));
      current = [];
      size = 0;
    }
    current.push(line);
    size += line.length + 1;
  }
  if (current.length) parts.push(current.join("\n"));
  return parts;
}

/** Messages in a transcript (or part), not counting the "…" between excerpts. */
export const countLines = (transcript) =>
  transcript.split("\n").filter((line) => line && line !== "…").length;
