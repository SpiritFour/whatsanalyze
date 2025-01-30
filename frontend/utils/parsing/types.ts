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
    { top5Emojis: EmojiStats[]; messageWithMostEmojis: Message }
  >;
  globalTop5Emojis: EmojiStats[];
  globalMessageWithMostEmojis: Message;
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
      longestMessage: Message;
      relativeWords: number;
      relativeMessages: number;
    }
  >;
  globalLongestMessage: Message | null;
  globalTop5Words: WordUsageStats[];
}

export interface TimeData {
  longestGap: number;
  longestGapStart: Date;
  longestGapEnd: Date;
}

export interface ActiveDates {
  dayWithMostMessages: { day: string | null; count: number };
  weekWithMostMessages: { week: string | null; count: number };
}
