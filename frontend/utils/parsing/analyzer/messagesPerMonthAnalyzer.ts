import type { Message, MessagesPerMonth } from "../types";

export function getNumberOfMessagesPerMonth(
  messages: Message[],
): MessagesPerMonth {
  const result: MessagesPerMonth = {};
  for (const message of messages) {
    const { author, date } = message;
    if (!author) continue;

    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const key = `${year}-${month}`;

    if (!result[author]) {
      result[author] = {};
    }
    if (!result[author][key]) {
      result[author][key] = 0;
    }
    result[author][key]++;
  }
  return result;
}
