import type {
  AuthorEmojiData,
  EmojiAnalysis,
  EmojiStats,
  Message,
} from "../types";

export function getMostUsedEmojis(messages: Message[]): EmojiAnalysis {
  const globalEmojiCountMap = new Map<string, number>();
  let globalMaxEmojiCount = 0;
  let globalMessageWithMostEmojis: Message | null = null;
  const authorEmojiData: Record<string, AuthorEmojiData> = {};

  for (const message of messages) {
    const { author, message: text } = message;
    if (!author) continue;

    if (!authorEmojiData[author]) {
      authorEmojiData[author] = {
        emojiCountMap: new Map(),
        maxEmojiCount: 0,
        messageWithMostEmojis: null,
      };
    }

    const emojis = text.match(/\p{Extended_Pictographic}/gu);
    if (!emojis) continue;

    for (const e of emojis) {
      globalEmojiCountMap.set(e, (globalEmojiCountMap.get(e) || 0) + 1);
    }

    const authorMap = authorEmojiData[author].emojiCountMap;
    for (const e of emojis) {
      authorMap.set(e, (authorMap.get(e) || 0) + 1);
    }

    if (emojis.length > globalMaxEmojiCount) {
      globalMaxEmojiCount = emojis.length;
      globalMessageWithMostEmojis = message;
    }

    if (emojis.length > authorEmojiData[author].maxEmojiCount) {
      authorEmojiData[author].maxEmojiCount = emojis.length;
      authorEmojiData[author].messageWithMostEmojis = message;
    }
  }

  const authors: Record<
    string,
    { top5Emojis: EmojiStats[]; messageWithMostEmojis: Message | null }
  > = {};
  for (const author in authorEmojiData) {
    const { emojiCountMap, messageWithMostEmojis } = authorEmojiData[author];
    const sorted = [...emojiCountMap.entries()].sort((a, b) => b[1] - a[1]);
    const top5Emojis = sorted
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));
    authors[author] = {
      top5Emojis,
      messageWithMostEmojis,
    };
  }

  const sortedGlobal = [...globalEmojiCountMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const globalTop5Emojis = sortedGlobal
    .slice(0, 5)
    .map(([emoji, count]) => ({ emoji, count }));

  return {
    authors,
    globalTop5Emojis,
    globalMessageWithMostEmojis,
  };
}
