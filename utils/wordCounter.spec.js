/* eslint-env jest */
import { analyzeWords } from "./wordCounter";

describe("analyzeWords", () => {
  it("returns null for empty or system messages", () => {
    expect(analyzeWords([])).toBeNull();
  });

  it("calculates total words, vocabulary richness and top words", () => {
    const messages = [
      {
        date: new Date("2026-01-01T10:00:00Z"),
        author: "Alice",
        message: "Hello world, coffee is delicious and coffee is life!",
      },
      {
        date: new Date("2026-01-01T10:05:00Z"),
        author: "Bob",
        message: "I love coffee too! Absolutely delicious morning.",
      },
    ];

    const result = analyzeWords(messages, 5);
    expect(result).not.toBeNull();
    expect(result.totalWords).toBeGreaterThan(10);
    expect(result.uniqueWords).toBeGreaterThan(5);
    expect(result.topWords[0].word).toBe("coffee");
    expect(result.topWords[0].count).toBe(3);
    expect(result.longestMessage.author).toBe("Alice");
    expect(result.participants.length).toBe(2);
  });
});
