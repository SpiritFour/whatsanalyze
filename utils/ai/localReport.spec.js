import {
  completeReport,
  namePeopleByAlias,
  parseTruncatedJson,
  readLocalReport,
  withoutThinking,
} from "./localReport";

/** A report as the model writes it, in the schema's field order. */
const REPORT = {
  answer: "",
  summary:
    "Zwei Freundinnen planen ihre Wochenenden und schicken sich Rezepte.",
  vibe: "Kochclub zu zweit",
  topics: [
    { title: "Rezepte", description: "Sie tauschen ständig neue Rezepte aus." },
    { title: "Ausflüge", description: "Jedes Wochenende ein neuer Plan." },
  ],
  people: [
    { name: "Person A", role: "Planerin", style: "Lange, genaue Nachrichten" },
    { name: "Person B", role: "Spontane", style: "Kurz, mit vielen Emojis" },
  ],
  dynamics: [
    { title: "Wer anfängt", description: "Meist schreibt Person A zuerst." },
    { title: "Humor", description: "Viele Insider über verbrannte Kuchen." },
  ],
  highlights: ["Der Kuchen, der zweimal verbrannte"],
};
const JSON_TEXT = JSON.stringify(REPORT);
/** The report cut off right after `marker`, as max_tokens would. */
const cutAfter = (marker) =>
  JSON_TEXT.slice(0, JSON_TEXT.indexOf(marker) + marker.length);

describe("parseTruncatedJson", () => {
  it("reads complete JSON as it is", () => {
    expect(parseTruncatedJson(JSON_TEXT)).toEqual(REPORT);
  });

  it("drops a string cut off mid-word, and the item it was in", () => {
    const json = parseTruncatedJson(cutAfter('"Meist schreibt'));
    expect(json.dynamics).toEqual([{ title: "Wer anfängt" }]);
    expect(json.people).toEqual(REPORT.people);
  });

  it("drops a key whose value never came", () => {
    const json = parseTruncatedJson(cutAfter('"highlights":'));
    expect(json).not.toHaveProperty("highlights");
    expect(json.dynamics).toEqual(REPORT.dynamics);
  });

  it("copes with a cut inside an escape", () => {
    expect(
      parseTruncatedJson('{"summary": "He said \\"hi\\"", "vibe": "a\\'),
    ).toEqual({
      summary: 'He said "hi"',
    });
  });

  it("ignores what comes after a complete value", () => {
    expect(parseTruncatedJson('{"summary": "x"} and then some')).toEqual({
      summary: "x",
    });
  });

  it("gives up when nothing complete is left", () => {
    expect(parseTruncatedJson('{"summ')).toBeNull();
    expect(parseTruncatedJson("")).toBeNull();
  });
});

describe("completeReport", () => {
  it("fills what is missing and drops items cut short", () => {
    expect(
      completeReport({
        summary: "S",
        topics: [{ title: "T", description: "D", extra: 1 }, { title: "T2" }],
        people: [{ name: "Person A" }],
        highlights: ["H", { not: "a string" }],
      }),
    ).toEqual({
      answer: "",
      summary: "S",
      vibe: "",
      topics: [{ title: "T", description: "D" }],
      people: [],
      dynamics: [],
      highlights: ["H"],
    });
  });
});

describe("readLocalReport", () => {
  it("keeps the part of a cut-off report that is complete", () => {
    const report = readLocalReport(cutAfter("verbrannte Kuchen"));
    expect(report.summary).toBe(REPORT.summary);
    expect(report.topics).toEqual(REPORT.topics);
    expect(report.people).toEqual(REPORT.people);
    expect(report.dynamics).toEqual([REPORT.dynamics[0]]);
    expect(report.highlights).toEqual([]);
  });

  it("refuses a report cut off before its summary", () => {
    expect(readLocalReport(cutAfter('"summary": "Zwei'))).toBeNull();
    expect(readLocalReport("not json")).toBeNull();
    expect(readLocalReport('"just a string"')).toBeNull();
  });
});

describe("withoutThinking", () => {
  test("drops the empty think block Qwen opens every answer with", () => {
    const json = JSON.stringify(REPORT);
    expect(withoutThinking(`<think>\n\n</think>\n\n${json}`)).toBe(json);
    expect(
      readLocalReport(withoutThinking(`<think>\n\n</think>\n\n${json}`)),
    ).not.toBeNull();
  });

  test("drops a think block with something in it", () => {
    expect(withoutThinking("<think>Let me see.</think>Answer")).toBe("Answer");
  });

  test("leaves an answer without one alone", () => {
    expect(withoutThinking("  Answer <think>later</think>")).toBe(
      "  Answer <think>later</think>",
    );
  });

  test("keeps nothing of a think block cut off before it closes", () => {
    expect(withoutThinking("<think>Still thinking about")).toBe("");
  });
});

describe("namePeopleByAlias", () => {
  const people = (...names) =>
    names.map((name) => ({ name, role: "r", style: "s" }));

  test("gives a nickname the placeholder nobody has", () => {
    const fixed = namePeopleByAlias({ people: people("Person A", "Adri") }, [
      "Person A",
      "Person B",
    ]);
    expect(fixed.people.map((p) => p.name)).toEqual(["Person A", "Person B"]);
  });

  test("leaves people already named by placeholder alone", () => {
    const report = { people: people("Person B", "Person A") };
    expect(namePeopleByAlias(report, ["Person A", "Person B"])).toEqual(report);
  });

  test("keeps a stray name when every placeholder is taken", () => {
    const fixed = namePeopleByAlias(
      { people: people("Person A", "Person B", "Someone") },
      ["Person A", "Person B"],
    );
    expect(fixed.people[2].name).toBe("Someone");
  });
});
