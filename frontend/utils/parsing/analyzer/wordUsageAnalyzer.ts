import type {
  AuthorStats,
  Message,
  WordUsageAnalysis,
  WordUsageStats,
} from "../types";

const STOP_WORDS = new Set([
  "<media",
  "<attached",
  "audio",
  "omitted>",
  "bild",
  "image",
  "<medien",
  "ausgeschlossen>",
  "weggelassen",
  "omitted",
  "_",
  "_weggelassen>",
  "_ommited>",
  "_omesso>",
  "_omitted",
  "_weggelassen",
  "_attached",
]);

export function getRelativeWordUsage(messages: Message[]): WordUsageAnalysis {
  const totalMessages = messages.length;
  let globalLongestMessage: Message | null = null;
  let globalLongestLength = 0;
  let totalWordCount = 0;
  const globalWordFreq = new Map<string, number>();
  const authorStats: Record<string, AuthorStats> = {};

  for (const msgObj of messages) {
    const { author, message } = msgObj;
    if (!author) continue;

    const length = message.length;
    if (!authorStats[author]) {
      authorStats[author] = {
        messageCount: 0,
        wordCount: 0,
        freqMap: new Map(),
        longestMessage: {
          length: 0,
          messageObject: null,
        },
      };
    }

    authorStats[author].messageCount++;

    if (length > globalLongestLength) {
      globalLongestLength = length;
      globalLongestMessage = msgObj;
    }

    if (length > authorStats[author].longestMessage.length) {
      authorStats[author].longestMessage.length = length;
      authorStats[author].longestMessage.messageObject = msgObj;
    }

    const words = message
      .toLowerCase()
      .split(/[^a-zA-Z0-9äöüÄÖÜß]+/)
      .filter(Boolean);
    const wordCount = words.length;
    authorStats[author].wordCount += wordCount;
    totalWordCount += wordCount;

    for (const word of words) {
      if (!STOP_WORDS.has(word)) {
        globalWordFreq.set(word, (globalWordFreq.get(word) || 0) + 1);
        const authorMap = authorStats[author].freqMap;
        authorMap.set(word, (authorMap.get(word) || 0) + 1);
      }
    }
  }

  const resultByAuthor: Record<
    string,
    {
      top5Words: WordUsageStats[];
      longestMessage: Message | null;
      relativeWords: number;
      relativeMessages: number;
    }
  > = {};

  for (const author in authorStats) {
    const { messageCount, wordCount, freqMap, longestMessage } =
      authorStats[author];
    const sortedAuthorWords = [...freqMap.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    const top5Words = sortedAuthorWords
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
    const relativeWords = totalWordCount === 0 ? 0 : wordCount / totalWordCount;
    const relativeMessages =
      totalMessages === 0 ? 0 : messageCount / totalMessages;
    resultByAuthor[author] = {
      top5Words,
      longestMessage: longestMessage.messageObject,
      relativeWords,
      relativeMessages,
    };
  }

  const sortedGlobalWords = [...globalWordFreq.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const globalTop5Words = sortedGlobalWords
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  return {
    authors: resultByAuthor,
    globalLongestMessage,
    globalTop5Words,
  };
}
