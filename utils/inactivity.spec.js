/* eslint-env jest */
import { analyzeInactivity, formatDuration, formatTimeAgo } from "./inactivity";

describe("useChatTool inactivity analysis", () => {
  test("formatDuration formats various millisecond intervals correctly", () => {
    expect(formatDuration(45000)).toBe("45s");
    expect(formatDuration(150000)).toBe("2m");
    expect(formatDuration(3600000 * 3 + 120000)).toBe("3h 2m");
    expect(formatDuration(86400000 * 4 + 3600000 * 5)).toBe("4d 5h");
  });

  test("formatTimeAgo computes relative time from reference date", () => {
    const now = new Date("2026-09-04T12:00:00Z");
    const tenMinutesAgo = new Date("2026-09-04T11:50:00Z");
    const twoDaysAgo = new Date("2026-09-02T10:00:00Z");

    expect(formatTimeAgo(tenMinutesAgo, now)).toBe("10m ago");
    expect(formatTimeAgo(twoDaysAgo, now)).toBe("2d 2h ago");
  });

  test("analyzeInactivity correctly extracts last message, gaps, and response latencies", () => {
    const messages = [
      {
        author: "Alice",
        date: new Date("2026-01-01T10:00:00Z"),
        message: "Hey Bob!",
      },
      {
        author: "Bob",
        date: new Date("2026-01-01T10:15:00Z"),
        message: "Hey Alice, how are you?",
      },
      {
        author: "Alice",
        date: new Date("2026-01-01T10:20:00Z"),
        message: "Doing great, let's catch up later.",
      },
      // 10-day gap
      {
        author: "Bob",
        date: new Date("2026-01-11T12:00:00Z"),
        message: "Are you still around?",
      },
    ];

    const result = analyzeInactivity(messages, 12);
    expect(result).not.toBeNull();
    expect(result.lastMessage.author).toBe("Bob");
    expect(result.lastMessage.message).toBe("Are you still around?");
    expect(result.totalMessages).toBe(4);
    expect(result.participants.length).toBe(2);

    // Check longest gap (Jan 1 to Jan 11 is 10 days)
    expect(result.longestGaps.length).toBeGreaterThan(0);
    expect(result.longestGaps[0].brokenBy).toBe("Bob");
    expect(result.longestGaps[0].durationFormatted).toContain("10d");

    // Check initiator tracking (gap > 6h)
    const bobInitiation = result.conversationInitiations.breakdown.find(
      (b) => b.author === "Bob"
    );
    expect(bobInitiation).toBeDefined();
    expect(bobInitiation.count).toBe(1);
  });
});
