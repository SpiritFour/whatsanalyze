import { inflate } from "pako";
import { Chat } from "~/utils/transformChatData";
import { SharedAnalysis, captureAnalysis } from "./analysisSnapshot";
import { buildSharePayload, parseSharePayload } from "./shareLink";

// Phrases that exist only inside message bodies. If any of them survives into
// a snapshot, the chat is travelling with it.
const SECRET = "pineapple-submarine-telephone";
const OTHER_SECRET = "weathervane-licorice-bicycle";

function message(author, date, text) {
  return { author, date: new Date(date), message: text };
}

function buildChat() {
  return new Chat([
    message("System", "2023-12-31T00:00:00", "group created"),
    message("Alex Morgan", "2024-01-01T23:30:00", `hey there ${SECRET} 😂`),
    message("Alex Morgan", "2024-01-02T23:15:00", `moin ${SECRET} again 😂`),
    message("Alex Morgan", "2024-01-03T23:45:00", `${SECRET} and some more`),
    message("Jordan Blake", "2024-01-02T07:10:00", `servus ${OTHER_SECRET} 👍`),
    message("Jordan Blake", "2024-01-03T07:20:00", `${OTHER_SECRET} servus 👍`),
  ]);
}

describe("captureAnalysis", () => {
  it("carries the numbers the charts need", async () => {
    const snapshot = await captureAnalysis(buildChat());

    expect(snapshot.totalMessages).toBe(5);
    expect(snapshot.numPersonsInChat).toBe(2);
    expect(snapshot.people.map((person) => person.name)).toEqual([
      "Alex Morgan",
      "Jordan Blake",
    ]);
    expect(snapshot.hourly.datasets).toHaveLength(2);
    expect(snapshot.socialStats.people).toHaveLength(2);
  });

  it("flattens the fun fact emoji, which arrive as a Set", async () => {
    const snapshot = await captureAnalysis(buildChat());

    // JSON writes a Set as `{}`, so a Set here reaches the other side empty.
    snapshot.funFacts.forEach((person) => {
      expect(Array.isArray(person.sortedEmojis)).toBe(true);
    });
    expect(
      JSON.parse(JSON.stringify(snapshot)).funFacts[0].sortedEmojis,
    ).toEqual(snapshot.funFacts[0].sortedEmojis);
  });

  it("carries no message text", async () => {
    const snapshot = await captureAnalysis(buildChat());
    const serialized = JSON.stringify(snapshot);

    // A whole message would be the giveaway; so would the sentence it sat in.
    expect(serialized).not.toContain("hey there");
    expect(serialized).not.toContain("and some more");
    expect(serialized).not.toContain("group created");
  });

  it("survives the trip through a share payload", async () => {
    const snapshot = await captureAnalysis(buildChat());
    const restored = parseSharePayload(buildSharePayload(snapshot));

    expect(restored.totalMessages).toBe(5);
    // Dates do not survive JSON, and the charts call Date methods on these.
    expect(restored.firstDate).toBeInstanceOf(Date);
    expect(restored.socialStats.start).toBeInstanceOf(Date);
    expect(restored.socialStats.start.toISOString()).toBe(
      snapshot.socialStats.start.toISOString(),
    );
  });

  it("packs to a size that does not grow with the chat", async () => {
    const snapshot = await captureAnalysis(buildChat());

    // A few kilobytes, and a chat a thousand times longer produces the same
    // shape: counts per hour, per weekday, a capped word list.
    expect(buildSharePayload(snapshot).length).toBeLessThan(20_000);
  });
});

describe("SharedAnalysis", () => {
  let analysis;
  let snapshot;

  beforeEach(async () => {
    snapshot = parseSharePayload(
      buildSharePayload(await captureAnalysis(buildChat())),
    );
    analysis = new SharedAnalysis(snapshot);
  });

  it("answers with promises, as Chat does", () => {
    // The word and emoji clouds call `.then` on these rather than awaiting
    // them, so a bare value is a TypeError and a chart that never fills.
    [
      "getLineGraphData",
      "getShareOfSpeech",
      "getHourlyData",
      "getDailyData",
      "getWeeklyData",
      "getAllWords",
      "getEmojiCloudData",
      "getFunFacts",
    ].forEach((method) => {
      expect(typeof analysis[method]().then).toBe("function");
    });
  });

  it("answers everything the charts ask a Chat for", async () => {
    expect(await analysis.getHourlyData()).toEqual(snapshot.hourly);
    expect(await analysis.getDailyData()).toEqual(snapshot.daily);
    expect(await analysis.getWeeklyData()).toEqual(snapshot.weekly);
    expect(await analysis.getLineGraphData()).toEqual(snapshot.lineGraph);
    expect(await analysis.getShareOfSpeech()).toEqual(snapshot.shareOfSpeech);
    expect(await analysis.getAllWords()).toEqual(snapshot.words);
    expect(await analysis.getEmojiCloudData()).toEqual(snapshot.emojis);
    expect(await analysis.getFunFacts()).toEqual(snapshot.funFacts);
    expect(analysis.numPersonsInChat).toBe(2);
  });

  it("stands in for the message list where only its ends are read", () => {
    // The stats above the charts want the count and the two outer dates, and
    // that is the whole of what a shared analysis can answer.
    expect(analysis.filterdChatObject).toHaveLength(5);
    expect(analysis.filterdChatObject[0].date).toBeInstanceOf(Date);
    expect(analysis.filterdChatObject.slice(-1)[0].date).toBeInstanceOf(Date);
    expect(analysis.filterdChatObject[2]).toBeUndefined();
  });

  it("hands the highlights their stats rather than recomputing them", () => {
    // There are no messages behind a shared analysis to recompute from.
    expect(analysis.socialStats).toBe(snapshot.socialStats);
  });
});

describe("the stored document", () => {
  it("holds nothing but the snapshot", async () => {
    const snapshot = await captureAnalysis(buildChat());
    const stored = JSON.parse(
      new TextDecoder().decode(inflate(buildSharePayload(snapshot))),
    );

    expect(Object.keys(stored).sort()).toEqual([
      "daily",
      "emojis",
      "firstDate",
      "funFacts",
      "hourly",
      "lastDate",
      "lineGraph",
      "numPersonsInChat",
      "people",
      "shareOfSpeech",
      "socialStats",
      "totalMessages",
      "version",
      "weekly",
      "words",
    ]);
  });
});
