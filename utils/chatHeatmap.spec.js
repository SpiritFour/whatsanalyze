/* eslint-env jest */
import { analyzeHeatmap } from "./chatHeatmap";

describe("analyzeHeatmap", () => {
  it("returns null for empty or system messages", () => {
    expect(analyzeHeatmap([])).toBeNull();
  });

  it("calculates 24h hourly distribution, peak hour and day vs night", () => {
    // 14:00 (day) and 23:00 (night)
    const messages = [
      {
        date: new Date("2026-01-01T14:15:00"),
        author: "Alice",
        message: "Afternoon chat",
      },
      {
        date: new Date("2026-01-01T14:45:00"),
        author: "Bob",
        message: "Another afternoon chat",
      },
      {
        date: new Date("2026-01-01T23:30:00"),
        author: "Alice",
        message: "Late night whisper",
      },
    ];

    const result = analyzeHeatmap(messages, 8);
    expect(result).not.toBeNull();
    expect(result.totalMessages).toBe(3);
    expect(result.peakHour).toBe(14);
    expect(result.peakHourCount).toBe(2);
    expect(result.peakHourLabel).toBe("14:00 – 15:00");
    expect(result.dayPct).toBe(67);
    expect(result.nightPct).toBe(33);
    expect(result.hourly[14]).toBe(2);
    expect(result.hourly[23]).toBe(1);
    expect(result.participants.length).toBe(2);
  });
});
