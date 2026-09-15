export function formatTimeAgo(date, referenceDate = new Date()) {
  const diffMs = Math.max(0, referenceDate.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30.4375);
  const diffYear = Math.floor(diffDay / 365.25);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) {
    const remMin = diffMin % 60;
    return remMin > 0 ? `${diffHour}h ${remMin}m ago` : `${diffHour}h ago`;
  }
  if (diffDay < 30) {
    const remHours = diffHour % 24;
    return remHours > 0 ? `${diffDay}d ${remHours}h ago` : `${diffDay}d ago`;
  }
  if (diffMonth < 12) {
    const remDays = Math.floor(diffDay % 30.4375);
    return remDays > 0
      ? `${diffMonth}mo ${remDays}d ago`
      : `${diffMonth}mo ago`;
  }
  return `${diffYear}y ${Math.floor(diffMonth % 12)}mo ago`;
}

export function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return `${sec}s`;
  if (min < 60) return `${min}m`;
  if (hour < 24) {
    const remM = min % 60;
    return remM > 0 ? `${hour}h ${remM}m` : `${hour}h`;
  }
  const remH = hour % 24;
  return remH > 0 ? `${day}d ${remH}h` : `${day}d`;
}

export function analyzeInactivity(messages, parseDurationMs = 0) {
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

  const now = new Date();
  const lastMsg = sorted[sorted.length - 1];
  const firstMsg = sorted[0];

  const timeSinceLastMs = Math.max(0, now.getTime() - lastMsg.date.getTime());
  const timeSinceLastDays = timeSinceLastMs / (1000 * 60 * 60 * 24);

  let inactivityStatus = "active";
  let inactivityStatusLabel = "Actively Communicating";
  let inactivityStatusBadge = "Active";
  let inactivityColor = "#00e676";

  if (timeSinceLastDays > 30) {
    inactivityStatus = "ghosted";
    inactivityStatusLabel = "Long-Term Inactive / Dormant";
    inactivityStatusBadge = "Frozen";
    inactivityColor = "#dd2c00";
  } else if (timeSinceLastDays > 7) {
    inactivityStatus = "inactive";
    inactivityStatusLabel = "Fading Out / High Latency";
    inactivityStatusBadge = "Inactive";
    inactivityColor = "#ff9100";
  } else if (timeSinceLastDays > 2) {
    inactivityStatus = "dormant";
    inactivityStatusLabel = "Quiet Since A Few Days";
    inactivityStatusBadge = "Quiet";
    inactivityColor = "#ffc107";
  }

  const participantMap = new Map();
  const allGaps = [];
  const GAP_BREAK_THRESHOLD_MS = 6 * 60 * 60 * 1000;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!participantMap.has(current.author)) {
      participantMap.set(current.author, {
        name: current.author,
        messages: [],
        responseTimesMs: [],
        initiations: 0,
      });
    }
    const pData = participantMap.get(current.author);
    pData.messages.push(current);

    if (i > 0) {
      const prev = sorted[i - 1];
      const deltaMs = current.date.getTime() - prev.date.getTime();

      if (deltaMs > 60 * 60 * 1000) {
        allGaps.push({
          durationMs: deltaMs,
          durationFormatted: formatDuration(deltaMs),
          startDate: prev.date,
          endDate: current.date,
          brokenBy: current.author,
          messageBefore: prev.message.slice(0, 80),
          messageAfter: current.message.slice(0, 80),
        });
      }

      if (deltaMs >= GAP_BREAK_THRESHOLD_MS) {
        pData.initiations += 1;
      }

      if (
        current.author !== prev.author &&
        deltaMs > 0 &&
        deltaMs <= 24 * 60 * 60 * 1000
      ) {
        pData.responseTimesMs.push(deltaMs);
      }
    } else {
      pData.initiations += 1;
    }
  }

  const longestGaps = allGaps
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 3);

  let totalInitiations = 0;
  participantMap.forEach((p) => {
    totalInitiations += p.initiations;
  });

  const participants = Array.from(participantMap.values())
    .map((p) => {
      const lastPMessage = p.messages[p.messages.length - 1];
      const pDiffMs = Math.max(0, now.getTime() - lastPMessage.date.getTime());

      const avgResponseMs =
        p.responseTimesMs.length > 0
          ? Math.round(
              p.responseTimesMs.reduce((sum, v) => sum + v, 0) /
                p.responseTimesMs.length
            )
          : 0;

      const initPct =
        totalInitiations > 0
          ? Math.round((p.initiations / totalInitiations) * 100)
          : 0;

      return {
        name: p.name,
        messageCount: p.messages.length,
        lastMessage: {
          date: lastPMessage.date,
          message: lastPMessage.message,
        },
        timeSinceLastMs: pDiffMs,
        timeSinceLastFormatted: formatTimeAgo(lastPMessage.date, now),
        avgResponseTimeMs: avgResponseMs,
        avgResponseTimeFormatted:
          avgResponseMs > 0 ? formatDuration(avgResponseMs) : "N/A",
        conversationStartersCount: p.initiations,
        conversationStartersPct: initPct,
      };
    })
    .sort((a, b) => b.messageCount - a.messageCount);

  const initiationsBreakdown = participants.map((p) => ({
    author: p.name,
    count: p.conversationStartersCount,
    percentage: p.conversationStartersPct,
  }));

  const totalDays = Math.max(
    1,
    Math.round(
      (lastMsg.date.getTime() - firstMsg.date.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return {
    lastMessage: {
      author: lastMsg.author,
      date: lastMsg.date,
      message: lastMsg.message,
    },
    timeSinceLastMs,
    timeSinceLastFormatted: formatTimeAgo(lastMsg.date, now),
    inactivityStatus,
    inactivityStatusLabel,
    inactivityStatusBadge,
    inactivityColor,
    participants,
    longestGaps,
    conversationInitiations: {
      total: totalInitiations,
      breakdown: initiationsBreakdown,
    },
    totalMessages: sorted.length,
    dateRange: {
      start: firstMsg.date,
      end: lastMsg.date,
      totalDays,
    },
    parseDurationMs,
  };
}
