import fs from "node:fs";
import { parseString } from "whatsapp-chat-parser";
import { markSystemMessages } from "../systemMessages";
import { buildDigest } from "./digest";
import { AI_QUESTIONS } from "./questions";

/**
 * The sample chat's AI readings ship with the site (static/sample/ai/) and
 * are shown instead of asking the cloud (utils/ai/sample.ts). Readings made
 * from another version of the chat are ignored, and the sample falls back to
 * the cloud: every sample run a paid one, and the visitor's free preview
 * spent on it. So they must be made again whenever the chat changes
 * (scripts/sample-chat/readings.mjs).
 */
const LANGUAGES = ["en", "de", "es", "fr", "pt", "it"];

let digest;
let people;
beforeAll(async () => {
  const text = fs.readFileSync("static/sample/chat.txt", "utf8");
  const messages = markSystemMessages(await parseString(text)).map((m) => ({
    ...m,
    author: typeof m.author === "string" ? m.author.trim() : m.author,
  }));
  const built = buildDigest(messages, 400_000);
  digest = built.digest;
  people = Object.values(built.names);
});

describe("the sample chat's readings", () => {
  test("the sample is the made-up couple, start to finish", () => {
    expect(people).toEqual(["Emma", "Leo"]);
  });

  test.each(LANGUAGES)(
    "%s: made from this chat, for every question",
    (lang) => {
      const file = JSON.parse(
        fs.readFileSync(`static/sample/ai/${lang}.json`, "utf8"),
      );
      expect(file.chat).toEqual({
        messages: digest.totalMessages,
        from: digest.firstDate,
        to: digest.lastDate,
      });

      const keys = [
        "none",
        ...AI_QUESTIONS.flatMap((q) =>
          q.needsMe ? people.map((person) => `${q.id}:${person}`) : [q.id],
        ),
      ];
      expect(Object.keys(file.readings).sort()).toEqual(keys.sort());
      for (const reading of Object.values(file.readings)) {
        expect(reading.summary).toBeTruthy();
        // The placeholders the AI saw are back to the real names.
        expect(JSON.stringify(reading)).not.toMatch(/Person [A-Z]\b/);
      }

      expect(file.coach).toHaveLength(5);
      for (const turn of file.coach) {
        expect(turn.prompt).toBeTruthy();
        expect(turn.reply).toBeTruthy();
        expect(turn.reply).not.toMatch(/Person [A-Z]\b/);
      }
    },
  );
});
