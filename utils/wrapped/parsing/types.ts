import type { Message as parserMessage } from "whatsapp-chat-parser";

export type Message = parserMessage;

export interface EmojiStats {
  emoji: string;
  count: number;
}

export type FirstMessageAnalytics = Record<string, Message>;

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
  totalWordCount: number;
  totalMessagesCount: number;
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

export interface EmojiMonthData {
  emoji: string;
  count: number;
}

export interface EmojiOverTimeAnalysis {
  sortedMonths: string[];
  monthlyTop5: Record<string, EmojiMonthData[]>;
}

/** utils/wrapped/highlights.js: the numbers behind the 2026 story. */
export type RoleId =
  | "nightOwl"
  | "earlyBird"
  | "novelist"
  | "minimalist"
  | "speedster"
  | "ghost"
  | "starter"
  | "emojiPoet"
  | "machineGun"
  | "interrogator"
  | "comedian"
  | "paparazzi";

export type Chronotype =
  "nightOwls" | "earlyBirds" | "lunchBreakers" | "eveningCrew" | "officeHours";

export interface HighlightPerson {
  name: string;
  messages: number;
  /** Of all messages, 0 to 1. */
  share: number;
  words: number;
  avgWords: number;
  media: number;
  topEmoji: string | null;
  /** Minutes; null with too few replies to say. */
  medianReplyMin: number | null;
  starts: number;
  startShare: number;
  nightShare: number;
  /** The age they text like; null with too few messages to say. */
  age: number | null;
  ageReasons: string[];
  ageEmoji: string | null;
  role: { id: RoleId; value: number } | null;
  words3: WordUsageStats[];
  /** Missing from stories shared before these were counted. */
  deleted?: number;
  edited?: number;
  voice?: number;
  /** Laughs from the others right after this person's messages. */
  laughsCaused?: number;
  phrases?: Record<PhraseKind, number>;
}

export type PhraseKind = "love" | "miss" | "sorry" | "night" | "morning";

export interface Chemistry {
  /** 50 to 99. */
  score: number;
  /** 0 to 100 each; null where there was too little to say. */
  parts: {
    balance: number;
    starts: number;
    presence: number;
    reply: number | null;
    laughs: number | null;
  };
}

export interface Stuff {
  photo: number;
  voice: number;
  video: number;
  sticker: number;
  gif: number;
  document: number;
  contact: number;
  other: number;
  links: number;
  deleted: number;
  edited: number;
}

export interface Highlights {
  version: number;
  year: number;
  isGroup: boolean;
  peopleCount: number;
  totals: {
    messages: number;
    words: number;
    media: number;
    daysActive: number;
    daysInSpan: number;
    perActiveDay: number;
    firstDate: string;
    lastDate: string;
    conversations: number;
    topEmoji: string | null;
  };
  /** Most messages first, eight at most. */
  people: HighlightPerson[];
  /** Messages per hour of the day, 0 to 23. */
  hours: number[];
  weekdays: number[];
  peakHour: number;
  afterMidnightShare: number;
  chronotype: Chronotype;
  /** Days as YYYY-MM-DD. */
  busiestDay: { date: string; count: number };
  streak: { days: number; start: string | null; end: string | null };
  silence: {
    hours: number;
    days: number;
    start: string | null;
    end: string | null;
  };
  // From version 2 on; a story shared before has none of these.
  chemistry?: Chemistry | null;
  stuff?: Stuff;
  funniest?: {
    author: string;
    text: string;
    laughs: number;
    strength: number;
    date: string;
  } | null;
  burst?: { author: string; count: number; date: string } | null;
  waited?: {
    author: string;
    text: string;
    minutes: number;
    date: string;
    answeredBy: string;
  } | null;
  marathon?: { date: string; minutes: number; messages: number } | null;
  latestNight?: {
    author: string;
    date: string;
    hour: number;
    minute: number;
  } | null;
}
