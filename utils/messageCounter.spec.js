/* eslint-env jest */
import { analyzeMessages } from "./messageCounter";

describe("analyzeMessages", () => {
  it("returns null for empty or system messages", () => {
    expect(analyzeMessages([])).toBeNull();
    expect(
      analyzeMessages([
        {
          date: new Date(),
          author: "System",
          message: "Messages and calls are end-to-end encrypted.",
        },
      ])
    ).toBeNull();
  });

  it("calculates message, line, character counts and participant breakdown", () => {
    const d1 = new Date("2026-01-01T10:00:00Z");
    const d2 = new Date("2026-01-01T10:05:00Z");
    const d3 = new Date("2026-01-03T12:00:00Z");

    const messages = [
      { date: d1, author: "Alice", message: "Hello!\nHow are you?" },
      { date: d2, author: "Bob", message: "I am great, thanks!" },
      { date: d3, author: "Alice", message: "Wonderful!" },
    ];

    const result = analyzeMessages(messages, 12);
    expect(result).not.toBeNull();
    expect(result.totalMessages).toBe(3);
    expect(result.totalLines).toBe(4); // 2 lines from first msg + 1 + 1
    expect(result.participants.length).toBe(2);
    expect(result.participants[0].name).toBe("Alice");
    expect(result.participants[0].messageCount).toBe(2);
    expect(result.participants[0].percentage).toBe(67);
    expect(result.participants[1].name).toBe("Bob");
    expect(result.participants[1].messageCount).toBe(1);
    expect(result.busiestDay.dateStr).toBe("2026-01-01");
    expect(result.busiestDay.count).toBe(2);
  });
});
