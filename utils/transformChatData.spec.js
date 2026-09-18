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
