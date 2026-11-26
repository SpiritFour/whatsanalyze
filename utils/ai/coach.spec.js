import {
  buildCoachHistory,
  isSafetyReply,
  isUnchangedRewrite,
  needsSupport,
} from "./coach";

describe("needsSupport", () => {
  it("catches self-harm in each of the site's languages", () => {
    for (const text of [
      "sometimes I want to die",
      "Ich denke an Suizid",
      "a veces quiero morir",
      "j'ai envie de mourir",
      "penso em me matar",
      "a volte voglio morire",
    ]) {
      expect(needsSupport(text)).toBe(true);
    }
  });

  it("leaves ordinary questions alone", () => {
    expect(needsSupport("Why do we always argue about money?")).toBe(false);
    expect(needsSupport("Is she still into me?")).toBe(false);
  });
});

describe("isSafetyReply", () => {
  it("finds the marker even with stray words around it", () => {
    expect(isSafetyReply("[SAFETY]")).toBe(true);
    expect(isSafetyReply(" [safety]\n")).toBe(true);
    expect(isSafetyReply("Sure! [SAFETY]")).toBe(true);
    expect(isSafetyReply("You both seem safe and happy.")).toBe(false);
  });
});

describe("isUnchangedRewrite", () => {
  const draft = "I feel like you only answer when it suits you. Can we talk?";

  test("the draft handed back word for word is unchanged", () => {
    expect(
      isUnchangedRewrite(`${draft}\n\n**Why:**\nI softened it.`, draft),
    ).toBe(true);
  });

  test("only punctuation and case changed is unchanged", () => {
    expect(
      isUnchangedRewrite(
        `i feel like you only answer when it suits you can we talk\nWhy: calmer.`,
        draft,
      ),
    ).toBe(true);
  });

  test("an explanation with no rewrite before it is unchanged", () => {
    expect(isUnchangedRewrite("Why: it was too blunt.", draft)).toBe(true);
  });

  test("the explanation is found in every language's word for why", () => {
    for (const why of ["Porquê:", "Pourquoi :", "Perché:", "Por qué:"]) {
      expect(isUnchangedRewrite(`${draft}\n${why} calmer.`, draft)).toBe(true);
    }
  });

  test("a real rewrite is not", () => {
    expect(
      isUnchangedRewrite(
        "I've missed hearing from you lately. Could we talk about how we text?\nWarum: softer start.",
        draft,
      ),
    ).toBe(false);
  });
});

describe("buildCoachHistory", () => {
  const pair = (i) => ({ sent: `q${i}`, reply: `a${i}` });

  test("caps history to maxTurns, dropping oldest first so it starts and ends on user", () => {
    const turns = Array.from({ length: 7 }, (_, i) => pair(i));
    const history = buildCoachHistory(turns, "q7", 11);
    expect(history).toHaveLength(11);
    expect(history[0]).toEqual({ role: "user", content: "q2" });
    expect(history[history.length - 1]).toEqual({
      role: "user",
      content: "q7",
    });
  });

  test("leaves out support handovers and entries without both sent and reply", () => {
    const turns = [
      { sent: "", support: true },
      { sent: "q0", reply: "a0" },
      { sent: "", reply: "orphan" },
      { sent: "q1" },
    ];
    expect(buildCoachHistory(turns, "q2", 11)).toEqual([
      { role: "user", content: "q0" },
      { role: "assistant", content: "a0" },
      { role: "user", content: "q2" },
    ]);
  });
});
