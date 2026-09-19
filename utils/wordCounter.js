import { COMMON_STOPWORDS } from "~/utils/stopwords";
import { participantMessages } from "~/utils/utils";

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/gi;

export function analyzeWords(messages, parseDurationMs = 0) {
  const validMessages = participantMessages(messages);

  if (validMessages.length === 0) {
    return null;
  }

  let totalWords = 0;
  let maxWordCount = 0;
  let longestMsg = null;
  const globalWordFreq = new Map();
  const participantMap = new Map();

  for (const msg of validMessages) {
    const rawWords = msg.message
      ? msg.message
          .toLowerCase()
          // Links first: the punctuation strip below would otherwise tear
          // "https://example.com" into the "words" https, example and com.
          .replace(URL_PATTERN, " ")
          .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'„“«»…0-9]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 1)
      : [];

    const wordCount = rawWords.length;
    totalWords += wordCount;

    if (wordCount > maxWordCount) {
      maxWordCount = wordCount;
      longestMsg = {
        author: msg.author,
        date: msg.date,
        wordCount,
        snippet: msg.message.slice(0, 120),
      };
    }

    if (!participantMap.has(msg.author)) {
      participantMap.set(msg.author, {
        name: msg.author,
        messageCount: 0,
        wordCount: 0,
        wordSet: new Set(),
      });
    }

    const p = participantMap.get(msg.author);
    p.messageCount += 1;
    p.wordCount += wordCount;

    for (const w of rawWords) {
      p.wordSet.add(w);
      if (!COMMON_STOPWORDS.has(w)) {
        globalWordFreq.set(w, (globalWordFreq.get(w) || 0) + 1);
      }
    }
  }

  const allUniqueWords = new Set();
  for (const p of participantMap.values()) {
    for (const w of p.wordSet) {
      allUniqueWords.add(w);
    }
  }

  const topWords = Array.from(globalWordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  const participants = Array.from(participantMap.values())
    .map((p) => {
      const percentage =
        totalWords > 0 ? Math.round((p.wordCount / totalWords) * 100) : 0;
      const avgWordsPerMessage =
        p.messageCount > 0
          ? Math.round((p.wordCount / p.messageCount) * 10) / 10
          : 0;
      return {
        name: p.name,
        messageCount: p.messageCount,
        wordCount: p.wordCount,
        uniqueWordCount: p.wordSet.size,
        avgWordsPerMessage,
        percentage,
      };
    })
    .sort((a, b) => b.wordCount - a.wordCount);

  const avgWordsPerMessage =
    validMessages.length > 0
      ? Math.round((totalWords / validMessages.length) * 10) / 10
      : 0;

  return {
    totalWords,
    uniqueWords: allUniqueWords.size,
    avgWordsPerMessage,
    longestMessage: longestMsg || {
      author: validMessages[0].author,
      date: validMessages[0].date,
      wordCount: 0,
      snippet: "",
    },
    topWords,
    participants,
    parseDurationMs,
  };
}
