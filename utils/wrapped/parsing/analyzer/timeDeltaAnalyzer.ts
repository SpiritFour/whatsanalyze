import type { Message, TimeData } from "../types";

export function getTimeData(messages: Message[]): TimeData {
  const sortedByDate = [...messages].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let longestGap = 0;
  let longestGapStart: Date | null = null;
  let longestGapEnd: Date | null = null;

  for (let i = 1; i < sortedByDate.length; i++) {
    const prevDate = new Date(sortedByDate[i - 1].date);
    const currentDate = new Date(sortedByDate[i].date);
    const gap = currentDate.getTime() - prevDate.getTime();
    if (gap > longestGap) {
      longestGap = gap;
      longestGapStart = prevDate;
      longestGapEnd = currentDate;
    }
  }

  return {
    longestGap,
    longestGapStart,
    longestGapEnd,
  };
}
