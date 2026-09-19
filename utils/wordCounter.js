import stopwordsDe from "stopwords-de";
import stopwordsEn from "stopwords-en";
import { participantMessages } from "~/utils/utils";

/**
 * Words that say nothing about a chat.
 *
 * The English and German lists come from the same packages the analyzer uses —
 * the hand-written list below only had 40 English words in it, so "yes", "are",
 * "is" and "can" walked straight into the top ten of every report. The rest of
 * the languages have no package here, so their most common words stay listed
 * by hand.
 */
const COMMON_STOPWORDS = new Set([
  ...stopwordsEn,
  ...stopwordsDe,
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "der",
  "die",
  "das",
  "und",
  "in",
  "zu",
  "den",
  "das",
  "nicht",
  "von",
  "sie",
  "ist",
  "des",
  "sich",
  "mit",
  "dem",
  "dass",
  "er",
  "es",
  "ein",
  "ich",
  "auf",
  "so",
  "eine",
  "auch",
  "als",
  "an",
  "nach",
  "wie",
  "im",
  "für",
  "man",
  "aber",
  "aus",
  "durch",
  "wenn",
  "nur",
  "war",
  "noch",
  "de",
  "la",
  "que",
  "el",
  "en",
  "y",
  "a",
  "los",
  "se",
  "del",
  "las",
  "un",
  "por",
  "con",
  "no",
  "una",
  "su",
  "para",
  "es",
  "al",
  "e",
  "o",
  "da",
  "do",
  "em",
  "um",
  "para",
  "com",
  "não",
  "uma",
  "os",
  "no",
  "se",
  "na",
  "por",
  "mais",
  "as",
  "dos",
  "como",
  "mas",
  "le",
  "de",
  "un",
  "à",
  "être",
  "et",
  "en",
  "avoir",
  "que",
  "pour",
  "dans",
  "ce",
  "il",
  "qui",
  "ne",
  "sur",
  "se",
  "pas",
  "plus",
  "pouvoir",
  "il",
  "di",
  "e",
  "che",
  "un",
  "a",
  "in",
  "per",
  "una",
  "del",
  "la",
  "sono",
  "con",
  "da",
  "le",
  "non",
  "si",
  "del",
  "dei",
  "ed",
  "<media",
  "omitted>",
  "omitted",
  "pm",
  "am",
  "null",
  "undefined",
]);

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
