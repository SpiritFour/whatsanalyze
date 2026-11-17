import { getChemistry, getMoments } from "~/utils/wrapped/moments";
import {
  isDeleted,
  isMedia,
  laughStrength,
  mediaKind,
  PHRASES,
  withoutEditMark,
} from "~/utils/wrapped/patterns";
import { getHighlights } from "~/utils/wrapped/highlights";

const at = (day, time, author, message, month = 3) => {
  const [hour, minute] = time.split(":").map(Number);
  return {
    date: new Date(2026, month - 1, day, hour, minute),
    author,
    message,
  };
};

describe("patterns", () => {
  test.each([
    "This message was deleted",
    "You deleted this message.",
    "‎Diese Nachricht wurde gelöscht.",
    "Se eliminó este mensaje.",
    "Ce message a été supprimé",
    "Questo messaggio è stato eliminato",
    "Esta mensagem foi apagada",
  ])("knows %p for a deleted message", (text) => {
    expect(isDeleted(text)).toBe(true);
  });

  test("does not take a message about deleting for a deleted one", () => {
    expect(isDeleted("I deleted that photo")).toBe(false);
  });

  test("reads an edited message without the export's note", () => {
    expect(withoutEditMark("see you at 8 <This message was edited>")).toBe(
      "see you at 8",
    );
    expect(
      withoutEditMark("bis gleich <Diese Nachricht wurde bearbeitet>"),
    ).toBe("bis gleich");
  });

  test.each([
    ["<Media omitted>", "other"],
    ["‎image omitted", "photo"],
    ["‎audio omitted", "voice"],
    ["‎sticker omitted", "sticker"],
    ["‎GIF omitted", "gif"],
    ["‎video omitted", "video"],
    ["Bild weggelassen", "photo"],
    ["PTT-20260301-WA0001.opus (file attached)", "voice"],
    ["<attached: 00000012-PHOTO-2026-03-01-10-00-00.jpg>", "photo"],
    ["STK-20260301-WA0003.webp (file attached)", "sticker"],
  ])("files %p under %p", (message, kind) => {
    expect(isMedia({ message })).toBe(true);
    expect(mediaKind({ message })).toBe(kind);
  });

  test("does not take a sentence ending in 'omitted' for an attachment", () => {
    expect(isMedia({ message: "honestly I think the part they omitted" })).toBe(
      false,
    );
  });

  test("measures how hard a message laughs", () => {
    expect(laughStrength("haha")).toBe(1);
    expect(laughStrength("hahahahahaha")).toBe(3);
    expect(laughStrength("😂😂😂")).toBe(3);
    expect(laughStrength("ok")).toBe(0);
  });

  test.each([
    ["love", "love you too ❤️"],
    ["love", "Ich liebe dich"],
    ["love", "te amo"],
    ["love", "je t’aime"],
    ["miss", "miss u already"],
    ["miss", "mi manchi"],
    ["sorry", "sorry, running late"],
    ["sorry", "tut mir leid!"],
    ["sorry", "desculpa"],
    ["night", "good night x"],
    ["night", "gute nacht 😴"],
    ["night", "buenas noches"],
    ["morning", "Morning ☀️"],
    ["morning", "guten morgen"],
    ["morning", "bom dia!"],
  ])("counts %p in %p", (kind, text) => {
    expect(PHRASES[kind].test(text)).toBe(true);
  });

  test.each([
    ["sorry", "sorrynotsorry"],
    ["love", "I love pizza"],
    ["morning", "this morning was rough"],
    ["night", "last night was fun"],
  ])("does not count %p in %p", (kind, text) => {
    expect(PHRASES[kind].test(text)).toBe(false);
  });
});

describe("getMoments", () => {
  test("credits a laugh to the message it answers, and quotes the funniest", () => {
    const { people, funniest } = getMoments([
      at(1, "10:00", "Ana", "I tried to fold a fitted sheet and lost"),
      at(1, "10:02", "Ben", "hahahahahaha 😂😂"),
      at(1, "11:00", "Ben", "my plant died again"),
      at(1, "11:01", "Ana", "haha"),
      // Long after: not a laugh at that.
      at(1, "18:00", "Ana", "lol"),
    ]);
    expect(people.get("Ana").laughsCaused).toBe(1);
    expect(people.get("Ben").laughsCaused).toBe(1);
    expect(funniest).toMatchObject({
      author: "Ana",
      text: "I tried to fold a fitted sheet and lost",
      laughs: 1,
      date: "2026-03-01",
    });
  });

  test("does not credit laughing back at laughter", () => {
    const { people, funniest } = getMoments([
      at(1, "10:00", "Ana", "hahaha"),
      at(1, "10:01", "Ben", "hahahaha"),
    ]);
    expect(people.get("Ana").laughsCaused).toBe(0);
    expect(funniest).toBeNull();
  });

  test("finds the double-texting record", () => {
    const messages = [at(1, "09:00", "Ben", "hi")];
    for (let i = 0; i < 7; i += 1) {
      messages.push(at(2, `10:0${i}`, "Ana", `are you there ${i}`));
    }
    messages.push(at(2, "11:00", "Ben", "sorry!"));
    expect(getMoments(messages).burst).toEqual({
      author: "Ana",
      count: 7,
      date: "2026-03-02",
    });
  });

  test("finds the question that waited longest for an answer", () => {
    const { waited } = getMoments([
      at(1, "22:00", "Ana", "are you awake?"),
      at(1, "22:05", "Ana", "hello??"),
      at(2, "08:00", "Ben", "I am now"),
      at(2, "08:10", "Ben", "coffee?"),
      at(2, "08:12", "Ana", "yes"),
    ]);
    // Asked first, answered ten hours later; the second "?" was the same wait.
    expect(waited).toEqual({
      author: "Ana",
      text: "are you awake?",
      minutes: 600,
      date: "2026-03-01",
      answeredBy: "Ben",
    });
  });

  test("finds the longest conversation without a twenty-minute pause", () => {
    const messages = [];
    for (let i = 0; i < 40; i += 1) {
      const minutes = 20 * 60 + i * 3;
      messages.push(
        at(
          5,
          `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`,
          i % 2 ? "Ana" : "Ben",
          "and then",
        ),
      );
    }
    expect(getMoments(messages).marathon).toEqual({
      date: "2026-03-05",
      minutes: 117,
      messages: 40,
    });
  });

  test("finds the latest night", () => {
    const { latestNight } = getMoments([
      at(1, "01:10", "Ana", "still up"),
      at(2, "03:47", "Ben", "can't sleep"),
      at(3, "06:00", "Ana", "morning"),
    ]);
    expect(latestNight).toEqual({
      author: "Ben",
      date: "2026-03-02",
      hour: 3,
      minute: 47,
    });
  });

  test("counts what was sent besides words, and what was taken back", () => {
    const { stuff, people } = getMoments([
      at(1, "10:00", "Ana", "‎image omitted"),
      at(1, "10:01", "Ana", "‎audio omitted"),
      at(1, "10:02", "Ben", "https://example.com/meme"),
      at(1, "10:03", "Ben", "This message was deleted"),
      at(1, "10:04", "Ben", "fine <This message was edited>"),
    ]);
    expect(stuff).toMatchObject({
      photo: 1,
      voice: 1,
      links: 1,
      deleted: 1,
      edited: 1,
    });
    expect(people.get("Ana").voice).toBe(1);
    expect(people.get("Ben").deleted).toBe(1);
  });
});

describe("getChemistry", () => {
  const person = (overrides) => ({
    share: 0.5,
    startShare: 0.5,
    medianReplyMin: 5,
    laughsCaused: 10,
    ...overrides,
  });

  test("is high for two people who write alike", () => {
    const result = getChemistry([person(), person()], {
      daysActive: 300,
      daysInSpan: 300,
    });
    expect(result.score).toBe(99);
  });

  test("stays between 50 and 99", () => {
    const result = getChemistry(
      [
        person({
          share: 0.95,
          startShare: 1,
          medianReplyMin: 1,
          laughsCaused: 30,
        }),
        person({
          share: 0.05,
          startShare: 0,
          medianReplyMin: 600,
          laughsCaused: 0,
        }),
      ],
      { daysActive: 1, daysInSpan: 365 },
    );
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(60);
  });

  test("leaves out what it cannot say", () => {
    const result = getChemistry(
      [
        person({ medianReplyMin: null, laughsCaused: 0 }),
        person({ medianReplyMin: 4, laughsCaused: 1 }),
      ],
      { daysActive: 100, daysInSpan: 200 },
    );
    expect(result.parts.reply).toBeNull();
    expect(result.parts.laughs).toBeNull();
  });

  test("is only for two people", () => {
    expect(
      getChemistry([person(), person(), person()], {
        daysActive: 1,
        daysInSpan: 1,
      }),
    ).toBeNull();
  });
});

describe("getHighlights with moments", () => {
  test("does not count a deleted message's words, nor an edit note's", () => {
    const result = getHighlights([
      at(1, "10:00", "Ana", "This message was deleted"),
      at(1, "10:01", "Ana", "pizza pizza pizza <This message was edited>"),
      at(1, "10:02", "Ben", "ok"),
    ]);
    const ana = result.people.find((p) => p.name === "Ana");
    expect(ana.words).toBe(3);
    expect(ana.deleted).toBe(1);
    expect(ana.edited).toBe(1);
    expect(result.stuff.deleted).toBe(1);
  });

  test("survives JSON with the moments in it", () => {
    const result = getHighlights([
      at(1, "10:00", "Ana", "I tried to fold a fitted sheet and lost"),
      at(1, "10:02", "Ben", "hahahaha"),
    ]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
