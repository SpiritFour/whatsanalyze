import moment from "moment";

/**
 * Building blocks for the court evidence PDF export.
 *
 * Everything in here is pure data shaping, deliberately free of jsPDF, so the
 * numbers that end up in front of a judge (line numbers, exhibit labels,
 * message counts, hashes) can be unit tested on their own.
 */

// Deletion notices are written in the language of the exporting phone, so
// counting them means matching the wording of every language we ship.
const DELETED_MESSAGE_PATTERNS = [
  /this message was deleted/i,
  /you deleted this message/i,
  /diese nachricht wurde gelöscht/i,
  /du hast diese nachricht gelöscht/i,
  /se eliminó este mensaje/i,
  /eliminaste este mensaje/i,
  /ce message a été supprimé/i,
  /vous avez supprimé ce message/i,
  /questo messaggio è stato eliminato/i,
  /hai eliminato questo messaggio/i,
  /esta mensagem foi apagada/i,
  /você apagou esta mensagem/i,
];

export const SYSTEM_SPEAKER = "[SYSTEM]";

const toDate = (value) => (value instanceof Date ? value : new Date(value));

/** Exact to the second, no locale guesswork — courts compare timestamps. */
export function formatExactTimestamp(date) {
  const parsed = toDate(date);
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return moment(parsed).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * When and where the PDF was produced, including the offset and the IANA zone
 * the timestamps above are printed in.
 */
export function formatExtractionTimestamp(date = new Date()) {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const stamp = moment(toDate(date));
  return `${stamp.format("YYYY-MM-DD HH:mm:ss")} (UTC${stamp.format("Z")}${
    zone ? ", " + zone : ""
  })`;
}

export function isDeletedMessage(message) {
  const text = message?.message || "";
  return DELETED_MESSAGE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Anything not written by a participant is a system notice: joins, leaves,
 * encryption notices, call entries. They stay in the transcript in full.
 */
export function isSystemMessage(message, participants) {
  const author = message?.author;
  if (!author || author.toLowerCase() === "system") return true;
  const known =
    participants instanceof Set ? participants : new Set(participants || []);
  return known.size > 0 && !known.has(author);
}

/** A-01 … A-99, B-01 …, and on to AA-01 for absurdly large chats. */
export function exhibitLabel(index) {
  const perLetter = 99;
  const number = String((index % perLetter) + 1).padStart(2, "0");
  let block = Math.floor(index / perLetter) + 1;
  let letters = "";
  while (block > 0) {
    letters = String.fromCharCode(65 + ((block - 1) % 26)) + letters;
    block = Math.floor((block - 1) / 26);
  }
  return `${letters}-${number}`;
}

export function fileExtension(fileName) {
  const parts = String(fileName || "").split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "";
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * WhatsApp sprinkles left-to-right marks into exported lines and uses CRLF on
 * some platforms. Both would show up as boxes or double spacing in the PDF,
 * and neither carries meaning — but nothing else is touched: a court copy must
 * reproduce the message as exported.
 */
export function normalizeMessageText(text) {
  return String(text ?? "")
    .replace(/‎|‏/g, "")
    .replace(/\r\n?/g, "\n");
}

/**
 * Turns the parsed chat into numbered transcript rows plus the exhibit list
 * for the annex. Both are built in one pass so the exhibit label printed next
 * to a message is guaranteed to be the one listed in the annex.
 */
export function buildTranscript(messages, participants = []) {
  const known = new Set(participants);
  const rows = [];
  const exhibits = [];
  let deleted = 0;
  let system = 0;

  messages.forEach((message, index) => {
    const isSystem = isSystemMessage(message, known);
    const row = {
      lineNumber: index + 1,
      timestamp: formatExactTimestamp(message.date),
      speaker: isSystem ? SYSTEM_SPEAKER : message.author,
      text: normalizeMessageText(message.message),
      isSystem,
      exhibit: null,
    };

    const fileName = message.attachment?.fileName;
    if (fileName) {
      const exhibit = {
        label: exhibitLabel(exhibits.length),
        lineNumber: row.lineNumber,
        timestamp: row.timestamp,
        sender: row.speaker,
        fileName,
        fileType: fileExtension(fileName),
        // filled in by the renderer, which is the only place with the bytes
        sha256: null,
        size: null,
      };
      exhibits.push(exhibit);
      row.exhibit = exhibit.label;
    }

    if (isSystem) system += 1;
    if (isDeletedMessage(message)) deleted += 1;
    rows.push(row);
  });

  return {
    rows,
    exhibits,
    stats: {
      total: messages.length,
      media: exhibits.length,
      deleted,
      system,
      participants: known.size,
      start: rows.length ? rows[0].timestamp : "",
      end: rows.length ? rows[rows.length - 1].timestamp : "",
    },
  };
}

/** Who is in the chat, under the name or number WhatsApp exported them as. */
export function buildRoster(messages, participants = []) {
  const known = new Set(participants);
  const roster = new Map();

  messages.forEach((message) => {
    if (isSystemMessage(message, known)) return;
    const entry = roster.get(message.author) || {
      name: message.author,
      messages: 0,
      first: "",
      last: "",
    };
    entry.messages += 1;
    const timestamp = formatExactTimestamp(message.date);
    if (!entry.first) entry.first = timestamp;
    entry.last = timestamp;
    roster.set(message.author, entry);
  });

  return [...roster.values()].sort((a, b) => b.messages - a.messages);
}

/**
 * The exact text the fallback hash is computed over, so a recipient can
 * reproduce it from the printed transcript when the source file is gone.
 */
export function buildCanonicalTranscript(rows) {
  return rows
    .map(
      (row) =>
        `${row.lineNumber}\t${row.timestamp}\t${row.speaker}\t${row.text}`
    )
    .join("\n");
}

export async function sha256Hex(data) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Hashes are unreadable in one run — print them in blocks of eight. */
export function formatHash(hash, groupsPerLine = 4) {
  if (!hash) return ["—"];
  const groups = hash.match(/.{1,8}/g) || [];
  const lines = [];
  for (let i = 0; i < groups.length; i += groupsPerLine) {
    lines.push(groups.slice(i, i + groupsPerLine).join(" "));
  }
  return lines;
}
