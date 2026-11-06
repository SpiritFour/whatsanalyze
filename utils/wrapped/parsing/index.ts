import type {
  ActiveDates,
  EmojiAnalysis,
  EmojiOverTimeAnalysis,
  FirstMessageAnalytics,
  Message,
  MessagesPerMonth,
  TimeData,
  WordUsageAnalysis,
} from "./types";
import { getMostUsedEmojis } from "~/utils/wrapped/parsing/analyzer/emojiAnalyzer";
import { getWordUsage } from "~/utils/wrapped/parsing/analyzer/wordUsageAnalyzer";
import { getTimeData } from "~/utils/wrapped/parsing/analyzer/timeDeltaAnalyzer";
import { getActiveDates } from "~/utils/wrapped/parsing/analyzer/activeDatesAnalyzer";
import { getNumberOfMessagesPerMonth } from "~/utils/wrapped/parsing/analyzer/messagesPerMonthAnalyzer";
import JSZip from "jszip";
import * as whatsapp from "whatsapp-chat-parser";
import { z } from "zod";
import { getFirstMessages } from "~/utils/wrapped/parsing/analyzer/firstMessagesAnalyzer";
import { getEmojiOverTime } from "~/utils/wrapped/parsing/analyzer/emojiOverTimeAnalyzer";
import { getTargetYear } from "~/utils/wrapped/dateUtils";
import { isSystemMessage } from "~/utils/systemMessages";

export interface ParserResult {
  getMostUsedEmojis: EmojiAnalysis;
  getNumberOfMessagesPerMonth: MessagesPerMonth;
  getWordUsage: WordUsageAnalysis;
  getTimeData: TimeData;
  getActiveDates: ActiveDates;
  getFirstMessages: FirstMessageAnalytics;
  getEmojiOverTime: EmojiOverTimeAnalysis;
}

class Parser {
  private readonly schema: z.ZodType<ParserResult>;

  constructor() {
    this.schema = z.object({
      getMostUsedEmojis: z.custom<EmojiAnalysis>(),
      getNumberOfMessagesPerMonth: z.custom<MessagesPerMonth>(),
      getWordUsage: z.custom<WordUsageAnalysis>(),
      getTimeData: z.custom<TimeData>(),
      getActiveDates: z.custom<ActiveDates>(),
      getFirstMessages: z.custom<FirstMessageAnalytics>(),
      getEmojiOverTime: z.custom<EmojiOverTimeAnalysis>(),
    }) as z.ZodType<ParserResult>;
  }

  async run(file: File): Promise<ParserResult> {
    const textData = await this.readFile(file);
    const messages = await whatsapp.parseString(textData, {
      parseAttachments: true,
    });
    return this.analyze(messages);
  }

  /**
   * The story for messages parsed already: a saved chat reopened from this
   * device (composables/useLibrary.ts), with no file to read.
   */
  analyze(messages: Message[]): ParserResult {
    const validMessages = this.filterValidMessages(messages);
    return {
      getMostUsedEmojis: getMostUsedEmojis(validMessages),
      getNumberOfMessagesPerMonth: getNumberOfMessagesPerMonth(validMessages),
      getWordUsage: getWordUsage(validMessages),
      getTimeData: getTimeData(validMessages),
      getActiveDates: getActiveDates(validMessages),
      getFirstMessages: getFirstMessages(validMessages),
      getEmojiOverTime: getEmojiOverTime(validMessages),
    };
  }

  serialize(data: ParserResult): string {
    return JSON.stringify(data);
  }

  deserialize(serializedData: string): ParserResult {
    const parsedData: unknown = JSON.parse(serializedData);
    return this.schema.parse(parsedData);
  }

  private async readFile(file: File): Promise<string> {
    if (file.name.endsWith(".zip")) {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      // iOS names the chat _chat.txt. Any other .txt in the archive can be an
      // attachment, even another chat's export sent in this one.
      const chat = zip.file("_chat.txt");
      if (chat) return await chat.async("text");
      for (const fileName of Object.keys(zip.files)) {
        const entry = zip.files[fileName];
        if (
          !entry.dir &&
          fileName.endsWith(".txt") &&
          !fileName.includes("__MACOSX/")
        ) {
          return await entry.async("text");
        }
      }
    }
    if (file.type === "text/plain") {
      return await file.text();
    }
    throw new Error("Unsupported file type");
  }

  private filterValidMessages(messages: Message[]): Message[] {
    const ignoredMessagePatterns = [/is a contact\.$/i];

    const nonIgnored = messages.filter((msg) => {
      if (msg.author === null) return false;
      if (isSystemMessage(msg.message)) return false;
      const normalizedMessage = msg.message.replace(/\u200e/g, "").trim();
      return !ignoredMessagePatterns.some((pattern) =>
        pattern.test(normalizedMessage),
      );
    });

    const targetYear = getTargetYear();
    const inTargetYear = nonIgnored.filter(
      (msg) => msg.date.getFullYear() === targetYear,
    );

    if (inTargetYear.length > 0) {
      return inTargetYear;
    }

    // If no messages match target year (e.g. test chats or older exports),
    // use messages from the latest year present in the chat so slides render
    const years = nonIgnored.map((msg) => msg.date.getFullYear());
    if (years.length > 0) {
      const latestYear = Math.max(...years);
      return nonIgnored.filter((msg) => msg.date.getFullYear() === latestYear);
    }

    return nonIgnored;
  }
}

export const parser = new Parser();
