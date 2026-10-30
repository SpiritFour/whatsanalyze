import { isSafetyReply, needsSupport } from "./coach";

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
