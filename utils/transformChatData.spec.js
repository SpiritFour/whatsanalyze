/* eslint-env jest */
import { Chat } from "./transformChatData";

describe("Chat.removeSystemMessages", () => {
  it("drops system messages without swallowing the first real one", () => {
    const messages = [
      { author: "System", message: "Messages and calls are end-to-end..." },
      { author: "Jane Doe", message: "first real message" },
      { author: "John Doe", message: "second real message" },
    ];

    expect(Chat.removeSystemMessages(messages)).toEqual([
      { author: "Jane Doe", message: "first real message" },
      { author: "John Doe", message: "second real message" },
    ]);
  });
});

describe("Chat.getEmojiCloudData", () => {
  it("extracts and aggregates emojis before applying the display limit", async () => {
    const chat = Object.create(Chat.prototype);
    chat._maxWordsEmojiCloud = 2;
    chat._allWords = Promise.resolve([
      { word: "common", freq: 10 },
      { word: "hello😂", freq: 3 },
      { word: "goodbye😂", freq: 2 },
      { word: "wave👋", freq: 2 },
      { word: "rare👍", freq: 1 },
    ]);

    await expect(chat.getEmojiCloudData()).resolves.toEqual([
      { word: "😂", freq: 5 },
      { word: "👋", freq: 2 },
    ]);
  });
});

describe("Chat message counting", () => {
  // Chat.removeSystemMessages is covered above; this is about every number on
  // the results page being drawn from that same set of messages.
  it("counts the same messages everywhere on the results page", async () => {
    const chat = new Chat([
      {
        date: new Date("2026-01-01T09:00:00Z"),
        author: "System",
        message: "Messages and calls are end-to-end encrypted.",
      },
      {
        date: new Date("2026-01-01T10:00:00Z"),
        author: "Alice",
        message: "first thing she said",
      },
      {
        date: new Date("2026-01-02T10:00:00Z"),
        author: "Bob",
        message: "hi",
      },
    ]);

    expect(chat.filterdChatObject.length).toBe(2);
    expect(chat.numPersonsInChat).toBe(2);

    const shareOfSpeech = await chat.getShareOfSpeech();
    const total = shareOfSpeech.datasets[0].data.reduce((a, b) => a + b, 0);
    expect(total).toBe(chat.filterdChatObject.length);
  });
});

describe("Chat.getAllWords", () => {
  it("leaves links and WhatsApp's own markers out of the word cloud", async () => {
    const message = "https://example.com/page <media omitted> pizza pizza";
    const chat = new Chat([
      { date: new Date(), author: "Alice", message },
      { date: new Date(), author: "Bob", message },
    ]);

    const words = (await chat.getAllWords()).map((entry) => entry.word);
    expect(words).toContain("pizza");
    expect(words).not.toContain("https://example.com/page");
    expect(words.some((word) => word.startsWith("<"))).toBe(false);
  });
});
