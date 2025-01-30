import type { Message as parserMessage } from "whatsapp-chat-parser";

export type Message = parserMessage;

export interface EmojiStats {
  emoji: string;
  count: number;
}

export interface AuthorEmojiData {
  emojiCountMap: Map<string, number>;
  maxEmojiCount: number;
  messageWithMostEmojis: Message | null;
}

export interface EmojiAnalysis {
  authors: Record<
    string,
    { top5Emojis: EmojiStats[]; messageWithMostEmojis: Message | null }
  >;
  globalTop5Emojis: EmojiStats[];
  globalMessageWithMostEmojis: Message | null;
}

export interface MessagesPerMonth {
  [author: string]: { [yearMonth: string]: number };
}

export interface WordUsageStats {
  word: string;
  count: number;
}

export interface AuthorStats {
  messageCount: number;
  wordCount: number;
  freqMap: Map<string, number>;
  longestMessage: { length: number; messageObject: Message | null };
}

export interface WordUsageAnalysis {
  authors: Record<
    string,
    {
      top5Words: WordUsageStats[];
      longestMessage: Message | null;
      relativeWords: number;
      relativeMessages: number;
    }
  >;
  globalLongestMessage: Message | null;
  globalTop5Words: WordUsageStats[];
}

export interface TimeData {
  longestGap: number;
  longestGapStart: Date | null;
  longestGapEnd: Date | null;
}

export interface ActiveDates {
  dayWithMostMessages: { day: string | null; count: number };
  weekWithMostMessages: { week: string | null; count: number };
}
