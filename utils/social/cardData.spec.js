import { Chat } from "~/utils/transformChatData";
import { buildSocialCards, collectSocialStats } from "./cardData";

// The card builder only ever asks for keys, so echoing them back keeps the
// assertions readable.
const t = (key) => key;

function message(author, date, text) {
  return { author, date: new Date(date), message: text };
}

function buildChat(messages) {
  // Chat keeps every line whose author is a real participant, so the leading
  // system notice is the only one the fixture needs to mirror a real export.
  return new Chat([
    message("System", "2023-12-31T00:00:00", "group created"),
    ...messages,
  ]);
}

const FIXTURE = [
  message("Alex Morgan", "2024-01-01T23:30:00", "hey there moin moin 😂 😂"),
  message("Alex Morgan", "2024-01-02T23:15:00", "moin moin again 😂"),
  message("Alex Morgan", "2024-01-03T23:45:00", "moin and some more words"),
  message("Jordan Blake", "2024-01-02T07:10:00", "servus 👍 PTT-20240102.opus"),
  message("Jordan Blake", "2024-01-03T07:20:00", "servus servus 👍"),
];

describe("collectSocialStats", () => {
  it("returns null for a chat without messages", () => {
    expect(collectSocialStats(buildChat([]))).toBeNull();
  });

  it("summarises the chat and every participant", () => {
    const stats = collectSocialStats(buildChat(FIXTURE));

    expect(stats.totalMessages).toBe(5);
    expect(stats.totalDays).toBe(3);
    expect(stats.activeDays).toBe(3);
    expect(stats.people).toHaveLength(2);

    const [alex, jordan] = stats.people;
    expect(alex.name).toBe("Alex Morgan");
    expect(alex.messages).toBe(3);
    expect(alex.peakHour).toBe(23);
    // Every one of Alex's messages lands late in the evening.
    expect(alex.lateShare).toBe(1);
    expect(alex.earlyShare).toBe(0);
    expect(alex.emojis[0]).toEqual({ emoji: "😂", count: 3 });

    expect(jordan.peakHour).toBe(7);
    expect(jordan.earlyShare).toBe(1);
    // The `.opus` attachment is the only voice note in the fixture.
    expect(jordan.voiceNotes).toBe(1);
    expect(jordan.emojis[0]).toEqual({ emoji: "👍", count: 2 });
  });

  it("picks words that belong to one person as their signature", () => {
    const stats = collectSocialStats(buildChat(FIXTURE));
    const [alex, jordan] = stats.people;

    expect(alex.signatureWords.map((entry) => entry.word)).toContain("moin");
    expect(jordan.signatureWords.map((entry) => entry.word)).toContain(
      "servus",
    );
  });
});

describe("buildSocialCards", () => {
  const stats = collectSocialStats(buildChat(FIXTURE));

  it("returns nothing without stats", () => {
    expect(buildSocialCards(null, { t })).toEqual([]);
  });

  it("builds the full set of highlight cards", () => {
    const cards = buildSocialCards(stats, {
      t,
      locale: "en",
    });

    expect(cards.map((card) => card.id)).toEqual([
      "overview",
      "duel",
      "clock",
      "emoji",
      "words",
    ]);
  });

  it("splits the duel into percentages and includes voice notes", () => {
    const [, duel] = buildSocialCards(stats, {
      t,
      locale: "en",
    });

    expect(duel.contenders.map((person) => person.name)).toEqual([
      "Alex Morgan",
      "Jordan Blake",
    ]);
    const messagesRow = duel.rows[0];
    expect(messagesRow.percents).toEqual([60, 40]);
    expect(messagesRow.values).toEqual(["3", "2"]);
    expect(duel.rows.map((row) => row.label)).toContain("socialCardVoiceNotes");
  });

  it("labels the late and the early person", () => {
    const clock = buildSocialCards(stats, {
      t,
      locale: "en",
    }).find((card) => card.id === "clock");

    expect(clock.people[0].peakLabel).toBe("23:00");
    expect(clock.people[1].peakLabel).toBe("07:00");
    // The badges are relative, so the card always shows the promised contrast
    // and one person can never hold both titles.
    expect(clock.people[0].badge).toBe("socialCardNightOwl");
    expect(clock.people[1].badge).toBe("socialCardEarlyBird");
  });

  it("puts the whole overview on the first card", () => {
    const [overview] = buildSocialCards(stats, { t, locale: "en" });

    expect(overview.stats.map((stat) => stat.label)).toEqual([
      "socialCardMessages",
      "socialCardDays",
      "socialCardPeople",
      "socialCardPerDay",
    ]);
  });
});
