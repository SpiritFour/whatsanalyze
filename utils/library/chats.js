import {
  CHAT_STORES,
  STORES,
  chatRange,
  deleteLibrary,
  request,
  transact,
} from "./database";
import {
  bucketByMonth,
  packMonth,
  revive,
  toStored,
  unpackMonths,
} from "./months";
import { chatTitle, summarize } from "./identity";
import { SYSTEM_AUTHOR } from "~/utils/systemMessages";

export const DAY = 86_400_000;

/** How saved chats are ordered everywhere: the one opened last comes first. */
const byLastOpened = (a, b) => b.lastOpenedAt - a.lastOpenedAt;

/** When a chat was last in use, for the 90-day rule. */
const lastUse = (chat) =>
  chat.lastOpenedAt ?? chat.updatedAt ?? chat.createdAt ?? 0;

export function newId() {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  // randomUUID only exists in secure contexts; a dev server reached over the
  // LAN is not one.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Where a chat's messages came from: the export's name, size and SHA-256
 * (ChatSource, composables/useChatTool.ts), its date range and when it was
 * added. A pasted or sample text has no file, and no source.
 */
function sourceEntry(source, summary, now) {
  return {
    name: source.name ?? null,
    size: source.size ?? null,
    sha256: source.sha256 ?? null,
    firstDate: summary.firstDate,
    lastDate: summary.lastDate,
    messages: summary.messages,
    importedAt: now,
  };
}

/** The parts of a chat record that follow from its messages. */
function described(summary, months) {
  return {
    participants: summary.participants,
    isGroup: summary.participants.length > 2,
    firstDate: summary.firstDate,
    lastDate: summary.lastDate,
    streamKey: summary.streamKey,
    counts: {
      messages: summary.messages,
      total: summary.total,
      attachments: summary.attachments,
      months,
    },
  };
}

/** Every saved chat, the most recently opened first. */
export async function listChats() {
  const chats = await transact([STORES.chats], "readonly", (tx) =>
    request(tx.objectStore(STORES.chats).getAll()),
  );
  return chats.sort(byLastOpened);
}

/**
 * Which saved chat an incoming set of messages already is, if any.
 *
 * This is the quick answer, from the records alone: an identical message
 * stream (identity.js), as the same export dropped again has. findSavedChat
 * below also catches the same chat in an export whose clock reads differ.
 */
export function matchSavedChat(chats, summary) {
  return chats.find((chat) => chat.streamKey === summary.streamKey) ?? null;
}

const MINUTE = 60_000;

/**
 * Are these two lists the same messages? The same people wrote them in the
 * same order, at the same times give or take `toleranceMs`: two exports of one
 * chat can disagree by a minute on some messages (seen on 44 of 15,000 in a
 * real pair of iOS exports), which a per-minute key can't absorb. Text is left
 * out, as in streamKey: media and "image omitted" read differently.
 */
export function sameStream(a, b, { toleranceMs = 2 * MINUTE } = {}) {
  const spoken = (list) =>
    list.filter((m) => m.author !== SYSTEM_AUTHOR && Number.isFinite(m.date));
  const left = spoken(a);
  const right = spoken(b);
  if (!left.length || left.length !== right.length) return false;
  return left.every(
    (message, i) =>
      message.author === right[i].author &&
      Math.abs(message.date - right[i].date) <= toleranceMs,
  );
}

/**
 * The saved chat these stored messages already are: an identical stream
 * (matchSavedChat), or failing that, a chat with the same people and the same
 * number of messages whose messages turn out to be the same ones (sameStream),
 * e.g. the same chat exported once with media and once without.
 *
 * Step 3 widens this to a newer export of a saved chat (the same export name,
 * or mostly the same people) and merges the two with mergeMessages, where this
 * step replaces what was saved with the identical copy.
 */
export async function findSavedChat(chats, summary, stored) {
  const exact = matchSavedChat(chats, summary);
  if (exact) return exact;
  const people = [...summary.participants].sort().join("\n");
  for (const chat of chats) {
    if (chat.counts?.messages !== summary.messages) continue;
    if ([...chat.participants].sort().join("\n") !== people) continue;
    const saved = await readStored(chat.id);
    if (saved && sameStream(saved.stored, stored)) return chat;
  }
  return null;
}

/**
 * Replace a chat's messages and its record together, in one transaction, so a
 * chat is never half written. `stored` is in the export's order, as toStored
 * leaves it.
 *
 * Step 3's merge writes through here too, or through packMonth and chatRange
 * directly when an update should only touch some months.
 */
export async function writeMessages(chat, stored) {
  const months = [...bucketByMonth(stored)].map(([month, messages]) =>
    packMonth(chat.id, month, messages),
  );
  const record = {
    ...chat,
    counts: {
      ...chat.counts,
      months: months.length,
      // What it takes on the disk, for the privacy panel.
      bytes: months.reduce((sum, month) => sum + month.data.byteLength, 0),
    },
  };
  await transact([STORES.chats, STORES.months], "readwrite", (tx) => {
    const store = tx.objectStore(STORES.months);
    store.delete(chatRange(chat.id));
    for (const month of months) store.put(month);
    tx.objectStore(STORES.chats).put(record);
  });
  return record;
}

/**
 * Save a parsed chat on this device, or recognize it as one already saved.
 *
 * `chat` is what the parser produced (messages, and the export's `source` when
 * there was a file) plus the name it was uploaded under. Resolves with the
 * saved record and whether it is new. Rejects when the browser refuses, with
 * `QuotaExceededError` when the disk is full: the caller falls back to keeping
 * the chat for the tab only.
 */
export async function saveChat(
  { messages, source = null, title = null },
  { now = Date.now() } = {},
) {
  const stored = messages.map(toStored);
  const summary = summarize(stored);
  if (!summary.messages) throw new Error("no_messages");

  const existing = await findSavedChat(await listChats(), summary, stored);
  const sameFile =
    existing &&
    source?.sha256 &&
    (existing.sources ?? []).some((known) => known.sha256 === source.sha256);

  if (sameFile) {
    // The very same file again: everything in it is saved already.
    const chat = await updateChat(existing.id, { lastOpenedAt: now });
    return { chat: chat ?? existing, isNew: false };
  }

  const months = bucketByMonth(stored).size;
  const chat = existing
    ? {
        // The same messages from another export, e.g. one with media: it
        // keeps its id, title, readings and "me", and takes the new copy.
        ...existing,
        ...described(summary, months),
        updatedAt: now,
        lastOpenedAt: now,
        sources: [
          ...(existing.sources ?? []),
          ...(source ? [sourceEntry(source, summary, now)] : []),
        ],
      }
    : {
        id: newId(),
        version: 1,
        title: chatTitle(title ?? source?.name),
        ...described(summary, months),
        // Step 3: "Anna ❤️" → "Anna", asked once and kept.
        aliases: {},
        me: null,
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
        // The cleaned-up route of the tool it was last used in.
        lastTool: null,
        // Step 4.
        locked: false,
        sources: source ? [sourceEntry(source, summary, now)] : [],
        // The Wrapped years this chat has been unwrapped for, so opening it
        // again doesn't count as another free analysis.
        wrappedYears: [],
      };

  return { chat: await writeMessages(chat, stored), isNew: !existing };
}

/** A chat's messages as stored: dates as numbers, in the export's order. */
export async function readStored(id) {
  const found = await transact(
    [STORES.chats, STORES.months],
    "readonly",
    async (tx) => {
      const chat = await request(tx.objectStore(STORES.chats).get(id));
      if (!chat) return null;
      const months = await request(
        tx.objectStore(STORES.months).getAll(chatRange(id)),
      );
      return { chat, months };
    },
  );
  // Unpacked after the transaction: inflating is the slow part, and the
  // transaction has nothing to wait for.
  return found && { chat: found.chat, stored: unpackMonths(found.months) };
}

/** A saved chat and its messages, ready for the analyzer. Null if it's gone. */
export async function readChat(id) {
  const found = await readStored(id);
  return found && { chat: found.chat, messages: revive(found.stored) };
}

/**
 * Open a saved chat: its messages, with "last opened" moved to now. The time
 * it was opened before comes back too, for analytics.
 */
export async function openChat(id, { now = Date.now() } = {}) {
  const found = await readChat(id);
  if (!found) return null;
  const chat = await updateChat(id, { lastOpenedAt: now });
  if (!chat) return null;
  return {
    chat,
    messages: found.messages,
    previouslyOpenedAt: found.chat.lastOpenedAt,
  };
}

/**
 * Change a chat's record: "me", the last tool, a Wrapped year. `change` is the
 * fields to set, or a function of the record that returns them. Null when the
 * chat is gone (forgotten in another tab, say).
 */
export async function updateChat(id, change) {
  return transact([STORES.chats], "readwrite", async (tx) => {
    const store = tx.objectStore(STORES.chats);
    const chat = await request(store.get(id));
    if (!chat) return null;
    const next = {
      ...chat,
      ...(typeof change === "function" ? change(chat) : change),
    };
    store.put(next);
    return next;
  });
}

/** Forget these chats: their records, months, readings and everything else. */
export async function forgetChats(ids) {
  if (!ids.length) return;
  await transact(CHAT_STORES, "readwrite", async (tx) => {
    const artifacts = tx.objectStore(STORES.artifacts);
    for (const id of ids) {
      tx.objectStore(STORES.chats).delete(id);
      tx.objectStore(STORES.months).delete(chatRange(id));
      tx.objectStore(STORES.derived).delete(chatRange(id));
      tx.objectStore(STORES.memory).delete(chatRange(id));
      tx.objectStore(STORES.media).delete(id);
      const keys = await request(artifacts.index("chatId").getAllKeys(id));
      for (const key of keys) artifacts.delete(key);
    }
  });
}

export const forgetChat = (id) => forgetChats([id]);

/**
 * Forget everything: the database itself goes, not just the list, so nothing
 * is left to find in the browser's storage either.
 */
export const forgetAll = () => deleteLibrary();

/**
 * Forget the chats nobody has opened in `days` days, for "Forget chats not
 * opened in 90 days". A browser can't run anything while the site is closed,
 * so this runs at the start of a visit, before the list is shown. Resolves
 * with the ids it forgot.
 */
export async function expireChats({ days = 90, now = Date.now() } = {}) {
  const cutoff = now - days * DAY;
  const stale = (await listChats()).filter((chat) => lastUse(chat) < cutoff);
  const ids = stale.map((chat) => chat.id);
  await forgetChats(ids);
  return ids;
}
