import { AI_QUESTIONS } from "./questions";
import {
  canSendReading,
  readingToSend,
  rememberSentOpened,
  sendParties,
  sentQuestion,
  sentReadingFrom,
  takeSentOpened,
  whatsAppLink,
  writeToReader,
} from "./sendReading";

/**
 * Who the reader is goes to the AI only for a reading written to them: one
 * that could be sent stays about both by name, or it never could be.
 */
describe("which readings are written to the reader", () => {
  const two = ["Jane Doe", "John Doe"];

  it("writes a reading about the two of them about both", () => {
    expect(writeToReader(null, two)).toBe(false);
    expect(writeToReader("better", two)).toBe(false);
  });

  it.each(["into", "worried", "gift", "arguments", "effort", "custom"])(
    "writes a %s reading to the reader",
    (preset) => {
      expect(writeToReader(preset, two)).toBe(true);
    },
  );

  it("writes to the reader in a group, where there's no one to send it to", () => {
    expect(writeToReader("better", ["Ann", "Ben", "Cat"])).toBe(true);
    expect(writeToReader(null, ["Ann", "Ben", "Cat"])).toBe(true);
  });

  it("keeps to what can be sent", () => {
    for (const preset of [null, ...AI_QUESTIONS.map((q) => q.id)]) {
      const sendable = canSendReading({
        asked: { preset, toReader: writeToReader(preset, two) },
      });
      expect(sendable).toBe(!writeToReader(preset, two));
    }
  });
});

/**
 * A reading can go to the other person in the chat only when it is about the
 * two of them: one about one side, sent to the other, can start the argument
 * it was meant to help with.
 */
const report = (asked, extra = {}) => ({
  kind: "ai",
  version: 1,
  insights: { summary: "Two people, a year in.", people: [] },
  question: "",
  asked,
  ranOn: "cloud",
  coverage: null,
  locked: null,
  ...extra,
});

describe("which readings can be sent", () => {
  it("sends the ones about the two of them", () => {
    expect(canSendReading(report({ preset: null, toReader: false }))).toBe(
      true,
    );
    expect(canSendReading(report({ preset: "better", toReader: false }))).toBe(
      true,
    );
  });

  it.each(["into", "worried", "gift", "arguments", "effort", "custom"])(
    "keeps a %s reading with the reader",
    (preset) => {
      expect(canSendReading(report({ preset, toReader: false }))).toBe(false);
    },
  );

  it("keeps a reading the AI wrote to the reader as you", () => {
    expect(canSendReading(report({ preset: "better", toReader: true }))).toBe(
      false,
    );
    expect(canSendReading(report({ preset: null, toReader: true }))).toBe(
      false,
    );
  });

  it("keeps a reading that doesn't say what it was asked", () => {
    expect(canSendReading(report(undefined))).toBe(false);
    expect(canSendReading(report(null))).toBe(false);
    expect(canSendReading(report({ preset: null }))).toBe(false);
    expect(canSendReading(null)).toBe(false);
  });

  it("marks only the communication question sendable", () => {
    expect(AI_QUESTIONS.filter((q) => q.sendable).map((q) => q.id)).toEqual([
      "better",
    ]);
  });
});

describe("who it goes between", () => {
  it("is the other one of two", () => {
    expect(sendParties(["Emma", "Leo"], "Emma")).toEqual({
      from: "Emma",
      to: "Leo",
    });
    expect(sendParties(["Emma", "Leo"], "Leo")).toEqual({
      from: "Leo",
      to: "Emma",
    });
  });

  it("waits for the reader to say which one they are", () => {
    expect(sendParties(["Emma", "Leo"], null)).toBeNull();
    expect(sendParties(["Emma", "Leo"], "Someone else")).toBeNull();
  });

  it("has nobody to send to in a group", () => {
    expect(sendParties(["Emma", "Leo", "Mia"], "Emma")).toBeNull();
    expect(sendParties(["Emma"], "Emma")).toBeNull();
  });
});

describe("what the link carries", () => {
  const preview = report(
    { preset: "better", toReader: false },
    { locked: { people: 1, dynamics: 2, topics: 2, highlights: 3 } },
  );

  it("is the reading as the reader saw it, from them", () => {
    const sent = readingToSend(preview, "Emma");
    expect(sent.insights).toEqual(preview.insights);
    expect(sent.asked).toEqual(preview.asked);
    expect(sent.sentBy).toEqual({ from: "Emma" });
  });

  it("leaves a free preview's locked cards behind", () => {
    expect(readingToSend(preview, "Emma").locked).toBeNull();
    // The reading on screen is left as it was
    expect(preview.locked).not.toBeNull();
  });

  it("opens as sent only if it could have been sent", () => {
    const sent = readingToSend(preview, "Emma");
    expect(sentReadingFrom(sent)).toBe("Emma");
    expect(sentQuestion(sent)).toBe("better");

    // A one-sided reading with a sender added by hand is just a shared report
    const oneSided = readingToSend(
      report({ preset: "worried", toReader: true }),
      "Emma",
    );
    expect(sentReadingFrom(oneSided)).toBeNull();
    expect(sentReadingFrom(report({ preset: null, toReader: false }))).toBe(
      null,
    );
    expect(
      sentReadingFrom({
        ...report({ preset: null, toReader: false }),
        sentBy: { from: "  " },
      }),
    ).toBeNull();
  });

  it("counts a reading with no question as none", () => {
    expect(sentQuestion(report({ preset: null, toReader: false }))).toBe(
      "none",
    );
  });
});

describe("the WhatsApp link", () => {
  it("leaves choosing the chat to WhatsApp, with the text encoded", () => {
    const link = whatsAppLink(
      "Here's what it said: https://whatsanalyze.com/s#a-b_c & more?",
    );
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(link.split("?text=")[1])).toBe(
      "Here's what it said: https://whatsanalyze.com/s#a-b_c & more?",
    );
    // The fragment can't end the wa.me link early
    expect(link).not.toContain("#");
  });
});

describe("a sent reading opened, then their own", () => {
  // Jest runs these in Node, which has no localStorage of its own.
  beforeEach(() => {
    const items = new Map();
    globalThis.localStorage = {
      getItem: (key) => (items.has(key) ? items.get(key) : null),
      setItem: (key, value) => items.set(key, String(value)),
      removeItem: (key) => items.delete(key),
    };
  });
  afterAll(() => delete globalThis.localStorage);

  it("counts their own reading once", () => {
    rememberSentOpened("better", 1_000);
    expect(takeSentOpened(2_000)).toBe("better");
    expect(takeSentOpened(3_000)).toBeNull();
  });

  it("forgets an opening after a month", () => {
    rememberSentOpened("none", 0);
    expect(takeSentOpened(31 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("is nothing without an opening", () => {
    expect(takeSentOpened()).toBeNull();
    localStorage.setItem("ai-share-opened", "not json");
    expect(takeSentOpened()).toBeNull();
  });
});

describe("its words", () => {
  // Imported here only: the whole site's strings are a big module.
  const { messages } = require("../translations");
  const sendKeys = Object.keys(messages.en.toolsAi).filter((key) =>
    /^(send|sent)[A-Z]/.test(key),
  );
  const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort();

  it.each(["de", "es", "pt", "fr", "it"])(
    "are all in %s, with the same placeholders",
    (locale) => {
      expect(sendKeys.length).toBeGreaterThan(20);
      for (const key of sendKeys) {
        const text = messages[locale].toolsAi[key];
        expect(typeof text).toBe("string");
        expect(placeholders(text)).toEqual(
          placeholders(messages.en.toolsAi[key]),
        );
      }
    },
  );

  it("put the link in both WhatsApp messages", () => {
    for (const locale of Object.keys(messages)) {
      for (const key of ["sendMessageBetter", "sendMessageNone"]) {
        expect(messages[locale].toolsAi[key]).toMatch(/\{link\}$/);
      }
    }
  });
});
