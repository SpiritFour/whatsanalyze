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
    const messages = whatsapp.parseString(textData, {
      parseAttachments: true,
    });
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
    const ignoredMessagePatterns = [
      /messages and calls are end-to-end encrypted/i,
      /is a contact\.$/i,
    ];

    return messages.filter((msg) => {
      const normalizedMessage = msg.message.replace(/\u200e/g, "").trim();
      const isIgnored = ignoredMessagePatterns.some((pattern) =>
        pattern.test(normalizedMessage)
      );

      return (
        msg.author !== null &&
        msg.date.getFullYear() === getTargetYear() &&
        !isIgnored
      );
    });
  }
}

export const parser = new Parser();
