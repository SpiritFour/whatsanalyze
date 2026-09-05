import type { EmojiMonthData, EmojiOverTimeAnalysis, Message } from "../types";

export function getEmojiOverTime(messages: Message[]): EmojiOverTimeAnalysis {
  const monthlyData: Record<string, Record<string, number>> = {};

  for (const message of messages) {
    const { date, message: text } = message;
    if (!date) continue;

    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const key = `${year}-${month}`;

    const emojis = text.match(/\p{Extended_Pictographic}/gu);
    if (!emojis) continue;

    if (!monthlyData[key]) {
      monthlyData[key] = {};
    }

    for (const emoji of emojis) {
      monthlyData[key][emoji] = (monthlyData[key][emoji] || 0) + 1;
    }
  }

  // Get all months with emoji data
  const monthsWithData = Object.keys(monthlyData).sort();

  // Generate all months in the range (from first to last month with data)
  let sortedMonths: string[] = [];
  if (monthsWithData.length > 0) {
    const firstMonth = monthsWithData[0];
    const lastMonth = monthsWithData[monthsWithData.length - 1];

    const [startYear, startMonth] = firstMonth.split("-").map(Number);
    const [endYear, endMonth] = lastMonth.split("-").map(Number);

    let year = startYear;
    let month = startMonth;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      sortedMonths.push(key);

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }

  // Top 5 emojis per month
  const monthlyTop5: Record<string, EmojiMonthData[]> = {};
  for (const month of sortedMonths) {
    if (!monthlyData[month]) {
      monthlyTop5[month] = [];
      continue;
    }
    const entries = Object.entries(monthlyData[month])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));
    monthlyTop5[month] = entries;
  }

  return {
    sortedMonths,
    monthlyTop5,
  };
}
