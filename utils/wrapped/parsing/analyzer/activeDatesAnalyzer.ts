import type { ActiveDates, Message } from "../types";

function getISOWeekNumber(dateObj: Date): string {
  const temp = new Date(
    Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
  );
  temp.setUTCDate(temp.getUTCDate() + 4 - (temp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getActiveDates(messages: Message[]): ActiveDates {
  const dayCount: Record<string, number> = {};
  const weekCount: Record<string, number> = {};

  for (const message of messages) {
    const d = new Date(message.date);
    const dayKey = d.toISOString().slice(0, 10);
    dayCount[dayKey] = (dayCount[dayKey] || 0) + 1;
    const weekKey = getISOWeekNumber(d);
    weekCount[weekKey] = (weekCount[weekKey] || 0) + 1;
  }

  let maxDay: string | null = null;
  let maxDayCount = 0;
  for (const day in dayCount) {
    if (dayCount[day] > maxDayCount) {
      maxDayCount = dayCount[day];
      maxDay = day;
    }
  }

  let maxWeek: string | null = null;
  let maxWeekCount = 0;
  for (const week in weekCount) {
    if (weekCount[week] > maxWeekCount) {
      maxWeekCount = weekCount[week];
      maxWeek = week;
    }
  }

  return {
    dayWithMostMessages: { day: maxDay, count: maxDayCount },
    weekWithMostMessages: { week: maxWeek, count: maxWeekCount },
  };
}
