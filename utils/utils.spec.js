import { chatDurationInDays, participantMessages } from "./utils";

describe("chatDurationInDays", () => {
  it("counts the calendar days the sample chat spans", () => {
    // static/chat_example.txt, the file every report in #411 was measured
    // against: 539.96 hours' worth of elapsed time over 540 calendar days.
    // Counting the raw difference truncated it to 539 on the analyzer while
    // the tools pages rounded it to 540.
    expect(
      chatDurationInDays(
        new Date("2019-08-26T18:47:00"),
        new Date("2021-02-16T17:47:00"),
      ),
    ).toBe(540);
  });

  it("does not lose a day when the chat ends earlier in the day than it started", () => {
    expect(
      chatDurationInDays(
        new Date("2026-01-01T18:00:00"),
        new Date("2026-01-03T09:00:00"),
      ),
    ).toBe(2);
  });

  it("is zero for a chat that happened inside one day", () => {
    expect(
      chatDurationInDays(
        new Date("2026-01-01T08:00:00"),
        new Date("2026-01-01T23:00:00"),
      ),
    ).toBe(0);
  });

  it("has no opinion about a chat with no dates", () => {
    expect(chatDurationInDays(undefined, undefined)).toBe(0);
  });
});

describe("participantMessages", () => {
  it("keeps only what a person wrote", () => {
    const messages = [
      { author: "System", message: "end-to-end encrypted" },
      { author: "", message: "no author" },
      { author: "   ", message: "blank author" },
      { author: "Jane", message: "Hi" },
    ];

    expect(participantMessages(messages)).toEqual([
      { author: "Jane", message: "Hi" },
    ]);
  });
});
