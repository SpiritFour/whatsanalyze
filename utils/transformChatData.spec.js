import { Chat } from "./transformChatData";

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
