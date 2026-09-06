export function analyzeMessages(messages, parseDurationMs = 0) {
  const validMessages = messages.filter(
    (m) =>
      m.author &&
      m.author.toLowerCase() !== "system" &&
      m.author.trim().length > 0
  );

  if (validMessages.length === 0) {
    return null;
  }

  const sorted = [...validMessages].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const startDate = sorted[0].date;
  const endDate = sorted[sorted.length - 1].date;
  const totalDays = Math.max(
    1,
    Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  let totalLines = 0;
  let totalChars = 0;
  const participantMap = new Map();
  const dayCounts = new Map();

  for (const msg of sorted) {
    const lines = msg.message ? msg.message.split("\n").length : 1;
    const chars = msg.message ? msg.message.length : 0;
    totalLines += lines;
    totalChars += chars;

    // Day bucket for busiest day (YYYY-MM-DD)
    const dayKey = msg.date.toISOString().split("T")[0];
    dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);

    if (!participantMap.has(msg.author)) {
      participantMap.set(msg.author, {
        name: msg.author,
        messageCount: 0,
        lineCount: 0,
        charCount: 0,
        wordsCount: 0,
      });
    }

    const p = participantMap.get(msg.author);
    p.messageCount += 1;
    p.lineCount += lines;
    p.charCount += chars;
    p.wordsCount += msg.message
      ? msg.message.trim().split(/\s+/).filter(Boolean).length
      : 0;
  }

  const totalMessages = sorted.length;
  const avgMessagesPerDay = Math.round((totalMessages / totalDays) * 10) / 10;

  // Busiest day
  let maxDayKey = "";
  let maxDayCount = 0;
  for (const [dayKey, count] of dayCounts.entries()) {
    if (count > maxDayCount) {
      maxDayCount = count;
      maxDayKey = dayKey;
    }
  }

  const participants = Array.from(participantMap.values())
    .map((p) => {
      const percentage = Math.round((p.messageCount / totalMessages) * 100);
      const avgChars =
        p.messageCount > 0 ? Math.round(p.charCount / p.messageCount) : 0;
      return {
        ...p,
        percentage,
        avgCharsPerMessage: avgChars,
      };
    })
    .sort((a, b) => b.messageCount - a.messageCount);

  return {
    totalMessages,
    totalLines,
    totalChars,
    totalDays,
    avgMessagesPerDay,
    dateRange: {
      start: startDate,
      end: endDate,
    },
    busiestDay: {
      dateStr: maxDayKey,
      count: maxDayCount,
    },
    participants,
    parseDurationMs,
  };
}
