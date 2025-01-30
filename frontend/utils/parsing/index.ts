import { FileReader } from './fileReader';
import { MessageFilter } from './messageFilter';
import { EmojiAnalyzer } from './analyzer/emojiAnalyzer';
import { WordUsageAnalyzer } from './analyzer/wordUsageAnalyzer';
import { TimeAnalyzer } from './analyzer/timeAnalyzer';
import { ActiveDatesAnalyzer } from './analyzer/activeDatesAnalyzer';
import type { Message } from './types';
import * as whatsapp from 'whatsapp-chat-parser';


declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent) => {
  const { file } = event.data;
  self.postMessage({ state: 'WORKING' });
  try {
    const textData = await FileReader.readFile(file);
    const messages: Message[] = parseMessages(textData); // Assume parseMessages is defined
    const validMessages = MessageFilter.filterValidMessages(messages);
    const emoji = EmojiAnalyzer.getMostUsedEmojis(validMessages);
    const messagesPerMonth = TimeAnalyzer.getNumberOfMessagesPerMonth(validMessages); // Assume function is defined
    const wordUsage = WordUsageAnalyzer.getRelativeWordUsage(validMessages);
    const time = TimeAnalyzer.getTimeData(messages);
    const active = ActiveDatesAnalyzer.getActiveDates(messages);
    const stats = { emoji, messagesPerMonth, wordUsage, time, active };
    self.postMessage({ response: { data: stats }, state: "DONE" });
  } catch (error: any) {
    self.postMessage({ response: { message: error.message }, state: 'ERROR' });
  }
});

// Helper function to parse messages (assuming whatsappChatParser is available)
function parseMessages(textData: string): Message[] {
  return whatsapp.parseString(textData, {
    parseAttachments: true,
  });
}

export const importTest = "asdf";