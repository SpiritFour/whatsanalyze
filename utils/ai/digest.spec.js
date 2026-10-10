import fs from "node:fs";
import { parseString } from "whatsapp-chat-parser";
import { markSystemMessages } from "../systemMessages";
import {
  buildDigest,
  restoreNames,
  sample,
  splitParts,
  tidyInsights,
} from "./digest";

const at = (minute) => new Date(2026, 0, 1, 12, minute);
const msg = (author, message, minute = 0, extra = {}) => ({
  author,
  message,
  date: at(minute),
  ...extra,
});

describe("buildDigest", () => {
  test("renames participants by message count and maps them back", () => {
    const { digest, names } = buildDigest(
      [
        msg("Bob", "hi", 1),
        msg("Anna Schmidt", "hey Bob", 2),
        msg("Anna Schmidt", "how are you", 3),
      ],
      10_000,
    );
    expect(digest.participants).toEqual([
      { alias: "Person A", messages: 2 },
      { alias: "Person B", messages: 1 },
    ]);
    expect(names).toEqual({ "Person A": "Anna Schmidt", "Person B": "Bob" });
    expect(digest.transcript).toContain("Person A: hey Person B");
    expect(digest.transcript).not.toMatch(/Anna|Bob/);
  });

  test("replaces first names too, but only as whole words", () => {
    const { digest } = buildDigest(
      [
        msg("Anna Schmidt", "x", 1),
        msg("Tom", "Anna, pass the banana. Anna Schmidt!", 2),
      ],
      10_000,
    );
    expect(digest.transcript).toContain(
      "Person B: Person A, pass the banana. Person A!",
    );
  });

  test("catches a full name run together inside a word", () => {
    const { digest } = buildDigest(
      [
        msg("Jane Doe", "x", 1),
        msg("Al", "user janeDoe92, pw JANEDOEStreet", 2),
      ],
      10_000,
    );
    expect(digest.transcript).toContain("user Person A92, pw Person AStreet");
  });

  test("blanks IBANs", () => {
    const { digest } = buildDigest(
      [msg("Al", "DE89 3704 0044 0532 0130 00 and DE89370400440532013000")],
      10_000,
    );
    expect(digest.transcript).toContain("[iban] and [iban]");
  });

  test("blanks links, emails and phone numbers but keeps dates", () => {
    const { digest } = buildDigest(
      [
        msg(
          "Al",
          "see https://x.com/a, mail me@x.org, call +49 151 2345 6789 on 12.10.2026",
        ),
      ],
      10_000,
    );
    expect(digest.transcript).toContain(
      "see [link] mail [email], call [phone] on 12.10.2026",
    );
  });

  test("leaves out system notices and media placeholders", () => {
    const { digest } = buildDigest(
      [
        msg("System", "Messages are end-to-end encrypted"),
        msg("Al", "<Media omitted>", 1),
        msg("Al", "photo", 2, { attachment: { fileName: "a.jpg" } }),
        msg("Al", "real text", 3),
      ],
      10_000,
    );
    expect(digest.transcript).toBe("2026-01-01 12:03 Person A: real text");
  });

  test("anonymizes other text the same way", () => {
    const { anonymize } = buildDigest(
      [msg("Anna Schmidt", "x", 1), msg("Tom", "y", 2)],
      10_000,
    );
    expect(anonymize("Is Anna into Tom? Ask anna@x.org")).toBe(
      "Is Person A into Person B? Ask [email]",
    );
  });

  test("throws when nobody said anything", () => {
    expect(() => buildDigest([msg("System", "x")], 100)).toThrow("no_messages");
  });

  test("the sample chat comes out within budget with no real names", async () => {
    const text = fs.readFileSync("static/chat_example.txt", "utf8");
    const messages = markSystemMessages(await parseString(text)).map((m) => ({
      ...m,
      author: typeof m.author === "string" ? m.author.trim() : m.author,
    }));
    const { digest, names } = buildDigest(messages, 3_000);
    expect(digest.transcript.length).toBeLessThanOrEqual(3_000);
    for (const real of Object.values(names)) {
      expect(digest.transcript).not.toContain(real);
    }
  });
});

describe("sample", () => {
  const lines = Array.from({ length: 200 }, (_, i) => `line ${i}`);

  test("keeps everything that fits", () => {
    expect(sample(lines.slice(0, 5), 1_000)).toBe(lines.slice(0, 5).join("\n"));
  });

  test("spreads windows across the chat and always ends on the latest", () => {
    const out = sample(lines, 600);
    expect(out.length).toBeLessThanOrEqual(600);
    expect(out).toContain("line 0\n");
    expect(out.endsWith("line 199")).toBe(true);
    expect(out).toContain("\n…\n");
  });
});

describe("restoreNames", () => {
  test("puts real names back everywhere, longest placeholder first", () => {
    const names = { "Person A": "Anna", "Person AA": "Zoe" };
    expect(
      restoreNames(
        {
          summary: "Person A and Person AA",
          people: [
            { name: "Person AA", role: "r", style: "Person A's friend" },
          ],
        },
        names,
      ),
    ).toEqual({
      summary: "Anna and Zoe",
      people: [{ name: "Zoe", role: "r", style: "Anna's friend" }],
    });
  });

  test("also undoes a placeholder the model translated", () => {
    expect(
      restoreNames(
        { summary: "Persona A y Personne B, Pessoa A, Person C" },
        { "Person A": "Ana", "Person B": "Luc" },
      ),
    ).toEqual({ summary: "Ana y Luc, Ana, Person C" });
  });
});

describe("splitParts", () => {
  test("cuts on line boundaries, in order, within the limit", () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line ${i}`);
    const parts = splitParts(lines.join("\n"), 60);
    expect(parts.join("\n")).toBe(lines.join("\n"));
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(60);
  });

  test("a short transcript stays one part", () => {
    expect(splitParts("a\nb", 1_000)).toEqual(["a\nb"]);
  });
});

describe("tidyInsights", () => {
  test("drops blanks and repeats, and caps the lists", () => {
    const tidy = tidyInsights({
      answer: "  yes ",
      summary: "s",
      vibe: "v",
      topics: [
        { title: "Trip", description: "Lisbon" },
        { title: "Trip again", description: "lisbon " },
        { title: "", description: "" },
      ],
      people: [{ name: "Person A", role: "r", style: "s" }, { name: "" }],
      dynamics: [{ title: "x", description: "" }],
      highlights: ["a", "", "a", "b", "c", "d"],
    });
    expect(tidy.answer).toBe("yes");
    expect(tidy.topics).toEqual([{ title: "Trip", description: "Lisbon" }]);
    expect(tidy.people).toHaveLength(1);
    expect(tidy.dynamics).toEqual([]);
    expect(tidy.highlights).toEqual(["a", "b", "c"]);
  });
});
