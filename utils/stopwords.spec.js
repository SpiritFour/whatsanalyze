import { isStopword, normalizeWord } from "./stopwords";

describe("normalizeWord", () => {
  it("lowercases words and strips surrounding punctuation", () => {
    expect(normalizeWord("Pizza,")).toBe("pizza");
    expect(normalizeWord("(Hello!)")).toBe("hello");
    expect(normalizeWord("«bonjour»")).toBe("bonjour");
    expect(normalizeWord("İstanbul!")).toBe("i\u0307stanbul");
    expect(normalizeWord(";)")).toBe("");
    expect(normalizeWord("...")).toBe("");
    expect(normalizeWord("")).toBe("");
  });

  it("keeps WhatsApp markers, emojis, variation selectors and ZWJ intact", () => {
    expect(normalizeWord("<media")).toBe("<media");
    expect(normalizeWord("omitted>")).toBe("omitted>");
    expect(normalizeWord("_attached")).toBe("_attached");
    expect(normalizeWord("...❤️...")).toBe("❤️");
    expect(normalizeWord("!😂,")).toBe("😂");
    expect(normalizeWord("👨‍👩‍👧‍👦!")).toBe("👨‍👩‍👧‍👦");
  });

  it("handles lone surrogates and non-kept supplementary code points", () => {
    expect(normalizeWord("\ud83d")).toBe("");
    expect(normalizeWord("\udc00")).toBe("");
    expect(normalizeWord("\ud83da\udc00")).toBe("a");
    expect(normalizeWord("\u{1F1E6}\u{1F1E7}")).toBe("");
    expect(normalizeWord("\u{1F1E6}hello\u{1F1E7}")).toBe("hello");
  });

  it("does not overflow the RegExp backtrack stack on huge non-word runs (WHATSANALYZE-11V)", () => {
    // 5M trailing dots after a UTF-16 character overflows V8's RegExpStack
    // (~4.19M entries) with the old `/^[^...]+|[^...]+$/gu` regex.
    const hugeTrailing = "\u0131" + ".".repeat(5_000_000);
    expect(normalizeWord(hugeTrailing)).toBe("\u0131");

    const hugeLeading = ".".repeat(5_000_000) + "\u0131";
    expect(normalizeWord(hugeLeading)).toBe("\u0131");
  });

  it("does not backtrack quadratically on long internal punctuation", () => {
    const internalPunct = "\u0131" + ".".repeat(50_000) + "\u0131";
    const start = Date.now();
    expect(normalizeWord(internalPunct)).toBe(internalPunct);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});

describe("isStopword", () => {
  it("matches stopwords after stripping edge punctuation", () => {
    expect(isStopword("Yes!")).toBe(true);
    expect(isStopword("pizza!")).toBe(false);
  });
});
