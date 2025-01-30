import type { Message } from "./types";
import { getMostUsedEmojis } from "~/utils/parsing/analyzer/emojiAnalyzer";
import { getRelativeWordUsage } from "~/utils/parsing/analyzer/wordUsageAnalyzer";
import { getTimeData } from "~/utils/parsing/analyzer/timeDeltaAnalyzer";
import { getActiveDates } from "~/utils/parsing/analyzer/activeDatesAnalyzer";
import { getNumberOfMessagesPerMonth } from "~/utils/parsing/analyzer/messagesPerMonthAnalyzer";
import JSZip from "jszip";
import * as whatsapp from "whatsapp-chat-parser";

class Parser<A extends Record<string, (messages: Message[]) => any>> {
  constructor(private readonly analyzers: A) {}

  async run(file: File): Promise<{ [K in keyof A]: ReturnType<A[K]> }> {
    const textData = await this.readFile(file);
    const messages = whatsapp.parseString(textData, {
      parseAttachments: true,
    });
    const validMessages = this.filterValidMessages(messages);

    const result: any = {};
    for (const key in this.analyzers) {
      result[key] = this.analyzers[key](messages); // Execute function and store result
    }
    return result;
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
    return messages.filter((msg) => msg.author !== null);
  }
}

export const defaultParser = new Parser({
  getMostUsedEmojis,
  getNumberOfMessagesPerMonth,
  getRelativeWordUsage,
  getTimeData,
  getActiveDates,
});

export type defaultParserResult = Awaited<ReturnType<typeof defaultParser.run>>;
