import type { Message, MessagesPerMonth } from "../types";

export function getNumberOfMessagesPerMonth(
  messages: Message[],
): MessagesPerMonth {
  const result: MessagesPerMonth = {};
  for (const message of messages) {
    const { author, date } = message;
    if (!author) continue;

    // The local getters: the parser builds its dates from the wall clock in
    // the export. Read as UTC, a "happy new year" sent at 00:01 in Berlin
    // was counted in December, and a 2026 chart opened with "Dec".
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
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
