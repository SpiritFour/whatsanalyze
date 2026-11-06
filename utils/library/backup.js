import { gzip, ungzip } from "pako";
import { listChats, matchSavedChat, readStored, writeMessages } from "./chats";
import { listArtifacts, putArtifacts } from "./artifacts";
import { summarize } from "./identity";
import { bucketByMonth, toStored } from "./months";

export { backupFileName, isBackupName } from "./identity";

/**
 * The backup file: every saved chat in one gzipped JSON file the visitor
 * downloads, and restores by dropping it on the page. Until sync exists it is
 * the only copy that survives clearing the browser (docs/saved-chats.md,
 * "Keeping it in the browser").
 *
 * Messages go in as stored (dates as numbers) rather than as the database's
 * gzipped months, so the file doesn't depend on how the database happens to
 * be laid out.
 */
export const BACKUP_FORMAT = "whatsanalyze-backup";
const BACKUP_VERSION = 1;

/** Every saved chat, its messages and its artifacts, as one gzipped file. */
export async function exportLibrary({ now = Date.now() } = {}) {
  const chats = [];
  for (const chat of await listChats()) {
    const found = await readStored(chat.id);
    if (!found) continue;
    chats.push({
      chat: found.chat,
      messages: found.stored,
      artifacts: await listArtifacts(chat.id),
    });
  }
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: now,
    chats,
  };
  return {
    bytes: gzip(new TextEncoder().encode(JSON.stringify(backup))),
    count: chats.length,
  };
}

/** The backup in these bytes, gzipped or (once Safari has unpacked it) not. */
export function parseBackup(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const gzipped = data[0] === 0x1f && data[1] === 0x8b;
  let backup;
  try {
    backup = JSON.parse(
      new TextDecoder().decode(gzipped ? ungzip(data) : data),
    );
  } catch {
    throw new Error("not_a_backup");
  }
  if (backup?.format !== BACKUP_FORMAT || !Array.isArray(backup.chats)) {
    throw new Error("not_a_backup");
  }
  if (backup.version > BACKUP_VERSION) throw new Error("backup_too_new");
  return backup;
}

/** A chat from a backup, checked: anything malformed is skipped, not stored. */
function readable(entry) {
  const messages = entry?.messages;
  if (
    typeof entry?.chat?.id !== "string" ||
    !Array.isArray(messages) ||
    !messages.length ||
    messages.some(
      (m) =>
        !Number.isFinite(m?.date) ||
        typeof m?.author !== "string" ||
        typeof m?.message !== "string",
    )
  ) {
    return null;
  }
  return entry;
}

/**
 * Put a backup's chats into the library. A chat that is already here stays as
 * it is and gains the readings and conversations it doesn't have yet; any other
 * comes back whole. Resolves with how many were added and how many were
 * already here.
 */
export async function importLibrary(bytes, { now = Date.now() } = {}) {
  const backup = parseBackup(bytes);
  const time = (value) => (Number.isFinite(value) ? value : now);
  const saved = await listChats();
  let added = 0;
  let merged = 0;

  for (const entry of backup.chats.map(readable).filter(Boolean)) {
    // Only the fields a message has, and the record follows from them,
    // whatever else the file claims.
    const stored = entry.messages.map(toStored);
    const summary = summarize(stored);
    if (!summary.messages) continue;
    const artifacts = Array.isArray(entry.artifacts) ? entry.artifacts : [];

    const here =
      saved.find((chat) => chat.id === entry.chat.id) ??
      matchSavedChat(saved, summary);
    if (here) {
      const known = new Set((await listArtifacts(here.id)).map((a) => a.id));
      await putArtifacts(
        artifacts
          .filter((a) => typeof a?.id === "string" && !known.has(a.id))
          .map((a) => ({ ...a, chatId: here.id })),
      );
      merged++;
      continue;
    }

    const chat = await writeMessages(
      {
        ...entry.chat,
        participants: summary.participants,
        isGroup: summary.participants.length > 2,
        firstDate: summary.firstDate,
        lastDate: summary.lastDate,
        streamKey: summary.streamKey,
        counts: {
          messages: summary.messages,
          total: summary.total,
          attachments: summary.attachments,
          months: bucketByMonth(stored).size,
        },
        createdAt: time(entry.chat.createdAt),
        updatedAt: time(entry.chat.updatedAt),
        lastOpenedAt: time(entry.chat.lastOpenedAt),
        sources: Array.isArray(entry.chat.sources) ? entry.chat.sources : [],
        wrappedYears: Array.isArray(entry.chat.wrappedYears)
          ? entry.chat.wrappedYears
          : [],
      },
      stored,
    );
    await putArtifacts(
      artifacts
        .filter((a) => typeof a?.id === "string")
        .map((a) => ({ ...a, chatId: chat.id })),
    );
    saved.push(chat);
    added++;
  }
  return { added, merged };
}
