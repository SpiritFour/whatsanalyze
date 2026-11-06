import { isSafetyReply, isUnchangedRewrite, needsSupport } from "./coach";

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
