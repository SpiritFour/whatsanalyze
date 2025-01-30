import type { Message, MessagesPerMonth, TimeData } from "../types";

export class TimeAnalyzer {
    static getTimeData(messages: Message[]): TimeData {
        const sortedByDate = [...messages].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
            longestGapEnd
        };
    }
    static getNumberOfMessagesPerMonth(messages: Message[]): MessagesPerMonth {
        const result: MessagesPerMonth = {};
        for (const message of messages) {
            const { author, date } = message;
            if (!author) continue;

            const d = new Date(date);
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
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
}