import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import fs from "fs";
import { parseString } from "whatsapp-chat-parser";
import { markSystemMessages, SYSTEM_AUTHOR } from "~/utils/systemMessages";
import {
  DAY,
  addArtifact,
  backupFileName,
  bucketByMonth,
  chatTitle,
  closeLibrary,
  exportLibrary,
  expireChats,
  forgetAll,
  forgetChat,
  importLibrary,
  isBackupName,
  keepArtifact,
  libraryExists,
  listArtifacts,
  listChats,
  monthKey,
  openChat,
  parseBackup,
  readChat,
  readSettings,
  revive,
  sameStream,
  saveChat,
  streamKey,
  toStored,
  transact,
  updateChat,
  writeSettings,
} from "./index";
import {
  didLocalAiFail,
  forgetLocalAiFailure,
  localAiFailure,
  rememberLocalAiFailure,
} from "./device";

/** What every upload surface does to a parsed export (parseChatText). */
const parse = async (text) =>
  markSystemMessages(await parseString(text, { parseAttachments: true })).map(
    (message, index) => ({
      ...message,
      author:
        typeof message.author === "string"
          ? message.author.trim()
          : message.author,
      absolute_id: index,
    }),
  );

const sampleChat = () =>
  parse(fs.readFileSync("tests/fixtures/chat_example.txt", "utf8"));

/** A synthetic chat: one message every `everyDays` days from `start`, in turns. */
const syntheticChat = ({
  authors = ["Alice Example", "Bob Example"],
  count = 40,
  start = new Date(2019, 4, 1, 12, 0),
  everyDays = 3,
} = {}) =>
  Array.from({ length: count }, (_, i) => ({
    date: new Date(start.getTime() + i * everyDays * DAY),
    author: authors[i % authors.length],
    message: `message ${i}`,
    absolute_id: i,
  }));

const source = (name, sha256 = `sha-${name}`) => ({ name, size: 1234, sha256 });

const NOW = new Date(2026, 10, 3, 10, 0).getTime();

beforeEach(async () => {
  // A fresh, empty browser for every test.
  await closeLibrary();
  globalThis.indexedDB = new IDBFactory();
});

afterAll(() => closeLibrary());

describe("saving and opening", () => {
  test("a saved chat comes back exactly as it went in", async () => {
    const messages = await sampleChat();
    const { chat, isNew } = await saveChat(
      { messages, source: source("WhatsApp Chat with Jane Doe.txt") },
      { now: NOW },
    );
    expect(isNew).toBe(true);

    const found = await readChat(chat.id);
    expect(found.messages).toHaveLength(messages.length);
    found.messages.forEach((message, i) => {
      expect(message.date).toBeInstanceOf(Date);
      expect(message.date.getTime()).toBe(messages[i].date.getTime());
      expect(message.author).toBe(messages[i].author);
      expect(message.message).toBe(messages[i].message);
      expect(message.absolute_id).toBe(i);
    });
  });

  test("describes the chat for the list", async () => {
    const messages = await sampleChat();
    const { chat } = await saveChat(
      { messages, source: source("WhatsApp Chat with Jane Doe.txt") },
      { now: NOW },
    );

    expect(chat.title).toBe("Jane Doe");
    expect(chat.participants).toHaveLength(2);
    expect(chat.participants).not.toContain(SYSTEM_AUTHOR);
    expect(chat.isGroup).toBe(false);
    // 536 participant messages and the encryption notice nobody sent
    expect(chat.counts.messages).toBe(536);
    expect(chat.counts.total).toBe(messages.length);
    expect(chat.firstDate).toBeLessThan(chat.lastDate);
    expect(chat.createdAt).toBe(NOW);
    expect(chat.lastOpenedAt).toBe(NOW);
    expect(chat.sources).toEqual([
      expect.objectContaining({
        name: "WhatsApp Chat with Jane Doe.txt",
        sha256: "sha-WhatsApp Chat with Jane Doe.txt",
        importedAt: NOW,
      }),
    ]);
    expect(await listChats()).toEqual([chat]);
  });

  test("stores only what a message is, never what was hung on it", async () => {
    const [message] = syntheticChat({ count: 1 });
    const stored = toStored(
      { ...message, attachment: { fileName: "IMG-1.jpg", data: [1, 2] }, x: 1 },
      0,
    );
    expect(stored).toEqual({
      date: message.date.getTime(),
      author: message.author,
      message: message.message,
      absolute_id: 0,
      attachment: { fileName: "IMG-1.jpg" },
    });
  });

  test("lists the chat opened last first, and opening moves it up", async () => {
    const first = await saveChat(
      { messages: syntheticChat(), source: source("a.txt") },
      { now: NOW - 2 * DAY },
    );
    const second = await saveChat(
      {
        messages: syntheticChat({ authors: ["Cara Example", "Dan Example"] }),
        source: source("b.txt"),
      },
      { now: NOW - DAY },
    );
    expect((await listChats()).map((c) => c.id)).toEqual([
      second.chat.id,
      first.chat.id,
    ]);

    const opened = await openChat(first.chat.id, { now: NOW });
    expect(opened.previouslyOpenedAt).toBe(NOW - 2 * DAY);
    expect(opened.chat.lastOpenedAt).toBe(NOW);
    expect((await listChats()).map((c) => c.id)).toEqual([
      first.chat.id,
      second.chat.id,
    ]);
  });

  test("refuses a chat in which nobody said anything", async () => {
    await expect(
      saveChat({
        messages: [{ date: new Date(), author: SYSTEM_AUTHOR, message: "x" }],
      }),
    ).rejects.toThrow("no_messages");
  });

  test("keeps changes to a chat's record", async () => {
    const { chat } = await saveChat({ messages: syntheticChat() });
    await updateChat(chat.id, { me: "Alice Example" });
    await updateChat(chat.id, (c) => ({
      wrappedYears: [...c.wrappedYears, 2026],
    }));
    const [saved] = await listChats();
    expect(saved.me).toBe("Alice Example");
    expect(saved.wrappedYears).toEqual([2026]);
    expect(await updateChat("gone", { me: "x" })).toBeNull();
  });
});

describe("the same chat again", () => {
  // The same chat, exported once with media and once without: iOS writes the
  // file's name where the export without media says "image omitted".
  const IOS = (attachment) =>
    [
      "[01.05.19, 12:00:00] Alice Example: ‎Messages and calls are end-to-end encrypted.",
      "[01.05.19, 12:00:30] Alice Example: Hello",
      `[01.05.19, 12:01:10] Bob Example: ‎${attachment}`,
      "[02.06.19, 08:15:00] Bob Example: Morning",
      "[03.07.19, 22:40:05] Alice Example: Night",
    ].join("\n");

  test("an export with media is the same stream as one without", async () => {
    const withMedia = await parse(
      IOS("<attached: 00000012-PHOTO-2019-05-01-12-01-10.jpg>"),
    );
    const withoutMedia = await parse(IOS("image omitted"));
    expect(withMedia[2].attachment?.fileName).toBe(
      "00000012-PHOTO-2019-05-01-12-01-10.jpg",
    );
    expect(streamKey(withMedia)).toBe(streamKey(withoutMedia));
  });

  test("a different chat is a different stream", async () => {
    const chat = syntheticChat();
    expect(streamKey(chat)).not.toBe(
      streamKey(syntheticChat({ authors: ["Bob Example", "Alice Example"] })),
    );
    expect(streamKey(chat)).not.toBe(streamKey(chat.slice(1)));
    // WhatsApp's own notices change with the phone's language
    expect(streamKey(chat)).toBe(
      streamKey([
        { date: new Date(), author: SYSTEM_AUTHOR, message: "Notice" },
        ...chat,
      ]),
    );
  });

  test("reopens the saved chat instead of saving a second one", async () => {
    const withoutMedia = await parse(IOS("image omitted"));
    const withMedia = await parse(
      IOS("<attached: 00000012-PHOTO-2019-05-01-12-01-10.jpg>"),
    );
    const first = await saveChat(
      { messages: withoutMedia, source: source("text-only.zip") },
      { now: NOW - DAY },
    );
    await updateChat(first.chat.id, { me: "Bob Example" });
    await addArtifact(first.chat.id, "ai-reading", { report: 1 });

    const again = await saveChat(
      { messages: withMedia, source: source("with-media.zip") },
      { now: NOW },
    );
    expect(again.isNew).toBe(false);
    expect(again.chat.id).toBe(first.chat.id);
    expect(await listChats()).toHaveLength(1);
    // It keeps what it had gathered, and takes the copy with file names.
    expect(again.chat.me).toBe("Bob Example");
    expect(await listArtifacts(first.chat.id)).toHaveLength(1);
    expect(again.chat.sources.map((s) => s.name)).toEqual([
      "text-only.zip",
      "with-media.zip",
    ]);
    expect(again.chat.counts.attachments).toBe(1);
    const { messages } = await readChat(first.chat.id);
    expect(messages[2].attachment).toEqual({
      fileName: "00000012-PHOTO-2019-05-01-12-01-10.jpg",
    });
  });

  test("reopens it when the other export's clock reads a minute off", async () => {
    // Two real exports of one chat disagreed by a minute on some messages.
    const messages = syntheticChat({ count: 60 });
    const shifted = messages.map((m, i) =>
      i % 7 === 3 ? { ...m, date: new Date(m.date.getTime() + 61_000) } : m,
    );
    expect(streamKey(shifted)).not.toBe(streamKey(messages));
    expect(sameStream(messages.map(toStored), shifted.map(toStored))).toBe(
      true,
    );

    const first = await saveChat(
      { messages, source: source("text-only.zip") },
      { now: NOW - DAY },
    );
    const again = await saveChat(
      { messages: shifted, source: source("with-media.zip") },
      { now: NOW },
    );
    expect(again.chat.id).toBe(first.chat.id);
    expect(await listChats()).toHaveLength(1);
    // The record now describes the copy on screen, so it's found by it.
    expect(again.chat.streamKey).toBe(streamKey(shifted));
  });

  test("tells apart chats that only look alike", () => {
    const messages = syntheticChat({ count: 20 }).map(toStored);
    const later = messages.map((m) => ({ ...m, date: m.date + 3 * 60_000 }));
    const swapped = messages.map((m, i) =>
      i === 5 ? { ...m, author: messages[6].author } : m,
    );
    expect(sameStream(messages, later)).toBe(false);
    expect(sameStream(messages, swapped)).toBe(false);
    expect(sameStream(messages, messages.slice(1))).toBe(false);
    expect(sameStream([], [])).toBe(false);
  });

  test("the very same file again only counts as opening it", async () => {
    const messages = syntheticChat();
    const first = await saveChat(
      { messages, source: source("a.zip", "same") },
      { now: NOW - DAY },
    );
    const again = await saveChat(
      { messages, source: source("a.zip", "same") },
      { now: NOW },
    );
    expect(again.isNew).toBe(false);
    expect(again.chat.id).toBe(first.chat.id);
    expect(again.chat.sources).toHaveLength(1);
    expect(again.chat.updatedAt).toBe(NOW - DAY);
    expect(again.chat.lastOpenedAt).toBe(NOW);
  });
});

describe("months", () => {
  test("keys a message by the month its date line shows", () => {
    expect(monthKey(new Date(2019, 0, 31, 23, 59))).toBe("2019-01");
    expect(monthKey(new Date(2019, 1, 1, 0, 0))).toBe("2019-02");
    expect(monthKey(new Date(2019, 11, 31, 23, 59).getTime())).toBe("2019-12");
  });

  test("stores one record per month the chat has messages in", async () => {
    // Every 10 days from Nov 2019: across a year boundary, with no gaps.
    const messages = syntheticChat({
      count: 12,
      start: new Date(2019, 10, 1, 9, 0),
      everyDays: 10,
    });
    const months = [...bucketByMonth(messages.map(toStored)).keys()];
    expect(months).toEqual(["2019-11", "2019-12", "2020-01", "2020-02"]);

    const { chat } = await saveChat({ messages });
    expect(chat.counts.months).toBe(4);
    const records = await transact(
      ["months"],
      "readonly",
      (tx) =>
        new Promise((resolve) => {
          const req = tx.objectStore("months").getAll();
          req.onsuccess = () => resolve(req.result);
        }),
    );
    expect(records.map((r) => r.month)).toEqual(months);
    expect(records.map((r) => r.count).reduce((a, b) => a + b)).toBe(12);
    // gzipped, not the JSON itself
    expect(records[0].data).toBeInstanceOf(Uint8Array);
    expect([records[0].data[0], records[0].data[1]]).toEqual([0x1f, 0x8b]);
  });

  test("keeps the export's order when a phone's clock jumped back", async () => {
    const messages = syntheticChat({ count: 6, everyDays: 20 });
    // The fourth message says it was sent a month before the third.
    messages[3] = { ...messages[3], date: new Date(2019, 3, 15, 8, 0) };
    const { chat } = await saveChat({ messages });
    const found = await readChat(chat.id);
    expect(found.messages.map((m) => m.message)).toEqual(
      messages.map((m) => m.message),
    );
  });

  test("revives dates, and refuses a chat whose dates are gone", () => {
    const [message] = revive([
      { date: 1556704800000, author: "A", message: "x" },
    ]);
    expect(message.date).toBeInstanceOf(Date);
    expect(message.date.getTime()).toBe(1556704800000);
    expect(() =>
      revive([{ date: "never", author: "A", message: "x" }]),
    ).toThrow();
  });
});

describe("forgetting", () => {
  test("forgets one chat and everything that belongs to it, and only that", async () => {
    const keep = await saveChat({ messages: syntheticChat() });
    const gone = await saveChat({
      messages: syntheticChat({ authors: ["Cara Example", "Dan Example"] }),
    });
    await addArtifact(keep.chat.id, "ai-reading", { n: 1 });
    await addArtifact(gone.chat.id, "ai-reading", { n: 2 });
    await keepArtifact(gone.chat.id, "coach", "r1", { turns: [] });

    await forgetChat(gone.chat.id);

    expect((await listChats()).map((c) => c.id)).toEqual([keep.chat.id]);
    expect(await readChat(gone.chat.id)).toBeNull();
    expect(await listArtifacts(gone.chat.id)).toEqual([]);
    expect(await listArtifacts(keep.chat.id)).toHaveLength(1);
    expect((await readChat(keep.chat.id)).messages).toHaveLength(40);
    const months = await transact(
      ["months"],
      "readonly",
      (tx) =>
        new Promise((resolve) => {
          const req = tx.objectStore("months").getAll();
          req.onsuccess = () => resolve(req.result);
        }),
    );
    expect(months.every((m) => m.chatId === keep.chat.id)).toBe(true);
  });

  test("forgetting everything deletes the database itself", async () => {
    await saveChat({ messages: syntheticChat() });
    expect(await libraryExists()).toBe(true);
    await forgetAll();
    expect(await libraryExists()).toBe(false);
  });

  test("a reading that lands after its chat was forgotten is dropped", async () => {
    const { chat } = await saveChat({ messages: syntheticChat() });
    await forgetChat(chat.id);
    expect(await addArtifact(chat.id, "ai-reading", {})).toBeNull();
    expect(await keepArtifact(chat.id, "coach", "r", {})).toBeNull();
  });
});

describe("forgetting chats not opened in 90 days", () => {
  test("is off unless turned on", async () => {
    await saveChat({ messages: syntheticChat() });
    expect(await readSettings()).toEqual({ autoForget: false });
    expect(await writeSettings({ autoForget: true })).toEqual({
      autoForget: true,
    });
    expect((await readSettings()).autoForget).toBe(true);
  });

  test("forgets exactly the chats not opened for 90 days", async () => {
    const make = (authors, openedDaysAgo) =>
      saveChat(
        { messages: syntheticChat({ authors }) },
        { now: NOW - openedDaysAgo * DAY },
      );
    const recent = await make(["A Example", "B Example"], 10);
    const edge = await make(["C Example", "D Example"], 90);
    const stale = await make(["E Example", "F Example"], 91);
    // Saved long ago, but opened last week.
    const reopened = await make(["G Example", "H Example"], 400);
    await openChat(reopened.chat.id, { now: NOW - 7 * DAY });
    await addArtifact(stale.chat.id, "ai-reading", {});

    const forgotten = await expireChats({ days: 90, now: NOW });

    expect(forgotten).toEqual([stale.chat.id]);
    expect((await listChats()).map((c) => c.id).sort()).toEqual(
      [recent.chat.id, edge.chat.id, reopened.chat.id].sort(),
    );
    expect(await listArtifacts(stale.chat.id)).toEqual([]);
  });
});

describe("backup", () => {
  test("a backup restores every chat, its messages and its readings", async () => {
    const messages = await sampleChat();
    const { chat } = await saveChat(
      { messages, source: source("WhatsApp Chat with Jane Doe.txt") },
      { now: NOW },
    );
    await updateChat(chat.id, { me: "John Doe" });
    await addArtifact(chat.id, "ai-reading", { report: { summary: "x" } });
    const group = await saveChat({
      messages: syntheticChat({
        authors: ["A Example", "B Example", "C Example"],
      }),
    });

    const { bytes, count } = await exportLibrary({ now: NOW });
    expect(count).toBe(2);
    expect([bytes[0], bytes[1]]).toEqual([0x1f, 0x8b]);

    await forgetAll();
    expect(await importLibrary(bytes)).toEqual({ added: 2, merged: 0 });

    const restored = await readChat(chat.id);
    expect(restored.chat.me).toBe("John Doe");
    expect(restored.chat.title).toBe("Jane Doe");
    expect(restored.messages.map((m) => [m.date.getTime(), m.message])).toEqual(
      messages.map((m) => [m.date.getTime(), m.message]),
    );
    expect(await listArtifacts(chat.id)).toEqual([
      expect.objectContaining({
        kind: "ai-reading",
        data: { report: { summary: "x" } },
      }),
    ]);
    expect((await readChat(group.chat.id)).chat.isGroup).toBe(true);
  });

  test("restoring onto chats already here adds only what they lack", async () => {
    const { chat } = await saveChat({ messages: syntheticChat() });
    await addArtifact(chat.id, "ai-reading", { n: 1 });
    const { bytes } = await exportLibrary();
    await addArtifact(chat.id, "ai-reading", { n: 2 });

    expect(await importLibrary(bytes)).toEqual({ added: 0, merged: 1 });
    expect(await listChats()).toHaveLength(1);
    expect(await listArtifacts(chat.id)).toHaveLength(2);
  });

  test("reads a backup that Safari has already unpacked", async () => {
    await saveChat({ messages: syntheticChat() });
    const { bytes } = await exportLibrary();
    const { ungzip } = require("pako");
    const unpacked = ungzip(bytes);
    expect(parseBackup(unpacked).chats).toHaveLength(1);
  });

  test("turns away anything that isn't a backup", async () => {
    const text = new TextEncoder().encode("[1/2/21, 09:00:00] A: hello");
    expect(() => parseBackup(text)).toThrow("not_a_backup");
    expect(() =>
      parseBackup(new TextEncoder().encode('{"format":"other","chats":[]}')),
    ).toThrow("not_a_backup");
    // A chat with a broken message is skipped, not stored.
    const broken = new TextEncoder().encode(
      JSON.stringify({
        format: "whatsanalyze-backup",
        version: 1,
        chats: [{ chat: { id: "x" }, messages: [{ date: "never" }] }],
      }),
    );
    expect(await importLibrary(broken)).toEqual({ added: 0, merged: 0 });
  });

  test("is told apart from a chat export by its name", () => {
    expect(isBackupName(backupFileName(NOW))).toBe(true);
    expect(backupFileName(NOW)).toMatch(
      /^whatsanalyze-backup-\d{4}-\d\d-\d\d\.json\.gz$/,
    );
    expect(isBackupName("whatsanalyze-backup-2026-11-03.json")).toBe(true);
    expect(isBackupName("WhatsApp Chat with Bob.txt")).toBe(false);
    expect(isBackupName("WhatsApp Chat - Bob.zip")).toBe(false);
  });
});

describe("titles", () => {
  test.each([
    ["WhatsApp Chat with Bob Example.txt", "Bob Example"],
    ["WhatsApp Chat - Bob Example.zip", "Bob Example"],
    ["WhatsApp-Chat mit Bob Example.txt", "Bob Example"],
    ["Chat de WhatsApp con Bob Example.txt", "Bob Example"],
    ["Conversa do WhatsApp com Bob Example.txt", "Bob Example"],
    ["Discussion WhatsApp avec Bob Example.txt", "Bob Example"],
    ["Chat WhatsApp con Bob Example.txt", "Bob Example"],
    ["WhatsApp Chat - Hiking Group (2).zip", "Hiking Group"],
    ["my export.txt", "my export"],
  ])("%s is called %s", (name, title) => {
    expect(chatTitle(name)).toBe(title);
  });

  test.each([
    "_chat.txt",
    "WhatsApp Chat.txt",
    "chat.zip",
    "chat_example.txt",
    "chat-export-2024.zip",
    "WhatsApp Chat export (3).txt",
    "",
    null,
  ])("%s names nobody", (name) => expect(chatTitle(name)).toBeNull());

  test("an Android export saves under its contact's name", async () => {
    const lines = [
      "1/2/21, 09:00 - Messages and calls are end-to-end encrypted.",
    ];
    for (let i = 0; i < 30; i++) {
      const author = i % 2 ? "Alice Example" : "Bob Example";
      lines.push(
        `1/${2 + (i % 20)}/21, ${9 + (i % 10)}:15 - ${author}: message ${i}`,
      );
    }
    const messages = await parse(lines.join("\n"));
    const { chat } = await saveChat({
      messages,
      source: source("WhatsApp Chat with Bob Example.txt"),
    });
    expect(chat.title).toBe("Bob Example");
    expect(chat.counts.messages).toBe(30);
    expect((await readChat(chat.id)).messages).toHaveLength(31);
  });
});

describe("remembering that on-device AI failed here", () => {
  const storage = new Map();
  beforeAll(() => {
    globalThis.localStorage = {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    };
  });
  afterAll(() => delete globalThis.localStorage);
  beforeEach(() => storage.clear());

  test("remembers a failure until a run works", () => {
    expect(didLocalAiFail()).toBe(false);
    rememberLocalAiFailure(
      { reason: "local_memory", model: "m", phase: "read" },
      { now: NOW },
    );
    expect(didLocalAiFail()).toBe(true);
    expect(localAiFailure()).toEqual(
      expect.objectContaining({ reason: "local_memory", model: "m", at: NOW }),
    );
    forgetLocalAiFailure();
    expect(didLocalAiFail()).toBe(false);
  });

  test("forgets it once the browser has been updated", () => {
    rememberLocalAiFailure({ reason: "local_unsupported" });
    const failure = JSON.parse([...storage.values()][0]);
    storage.set(
      [...storage.keys()][0],
      JSON.stringify({ ...failure, userAgent: "an older browser" }),
    );
    expect(didLocalAiFail()).toBe(false);
  });
});
