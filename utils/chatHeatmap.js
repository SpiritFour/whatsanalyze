export function analyzeHeatmap(messages, parseDurationMs = 0) {
  const validMessages = messages.filter(
    (m) =>
      m.author &&
      m.author.toLowerCase() !== "system" &&
      m.author.trim().length > 0
  );

  if (validMessages.length === 0) {
    return null;
  }

  const hourly = new Array(24).fill(0);
  const daysOfWeek = new Array(7).fill(0);
  let dayCount = 0;
  let nightCount = 0;

  const participantMap = new Map();

  for (const msg of validMessages) {
    const h = msg.date.getHours();
    const d = msg.date.getDay();

    hourly[h] += 1;
    daysOfWeek[d] += 1;

    // Day: 6 AM to 10 PM (hours 6 through 21)
    if (h >= 6 && h < 22) {
      dayCount += 1;
    } else {
      nightCount += 1;
    }

    if (!participantMap.has(msg.author)) {
      participantMap.set(msg.author, {
        name: msg.author,
        hourly: new Array(24).fill(0),
        dayCount: 0,
        nightCount: 0,
        total: 0,
      });
    }

    const p = participantMap.get(msg.author);
    p.hourly[h] += 1;
    p.total += 1;
    if (h >= 6 && h < 22) {
      p.dayCount += 1;
    } else {
      p.nightCount += 1;
    }
  }

  const total = validMessages.length;
  const maxHourlyCount = Math.max(...hourly, 1);
  const hourlyPercentages = hourly.map((c) =>
    Math.round((c / maxHourlyCount) * 100)
  );

  let peakHour = 0;
  let peakHourCount = 0;
  for (let i = 0; i < 24; i++) {
    if (hourly[i] > peakHourCount) {
      peakHourCount = hourly[i];
      peakHour = i;
    }
  }

  const nextHour = (peakHour + 1) % 24;
  const formatHour = (h) => `${h.toString().padStart(2, "0")}:00`;
  const peakHourLabel = `${formatHour(peakHour)} – ${formatHour(nextHour)}`;

  let peakDayIndex = 0;
  let peakDayCount = 0;
  for (let i = 0; i < 7; i++) {
    if (daysOfWeek[i] > peakDayCount) {
      peakDayCount = daysOfWeek[i];
      peakDayIndex = i;
    }
  }

  const dayPct = Math.round((dayCount / total) * 100);
  const nightPct = 100 - dayPct;
  const peakDayPct = Math.round((peakDayCount / total) * 100);

  const participants = Array.from(participantMap.values())
    .map((p) => {
      let pPeakH = 0;
      let pPeakC = 0;
      for (let i = 0; i < 24; i++) {
        if (p.hourly[i] > pPeakC) {
          pPeakC = p.hourly[i];
          pPeakH = i;
        }
      }
      return {
        name: p.name,
        total: p.total,
        dayPct: p.total > 0 ? Math.round((p.dayCount / p.total) * 100) : 0,
        nightPct: p.total > 0 ? Math.round((p.nightCount / p.total) * 100) : 0,
        peakHour: pPeakH,
        peakHourLabel: `${formatHour(pPeakH)} – ${formatHour(
          (pPeakH + 1) % 24
        )}`,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    totalMessages: total,
    hourly,
    hourlyPercentages,
    maxHourlyCount,
    peakHour,
    peakHourCount,
    peakHourLabel,
    dayCount,
    nightCount,
    dayPct,
    nightPct,
    daysOfWeek,
    peakDayIndex,
    peakDayCount,
    peakDayPct,
    participants,
    parseDurationMs,
  };
}
