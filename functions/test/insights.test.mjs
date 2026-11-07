// Run with `npm test` in functions/ (Node 22 strips the TypeScript types).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAnswerPrompt,
  buildCoachPrompt,
  buildNotesPrompt,
  buildPrompt,
} from "../src/ai/insights.ts";

/**
 * The reader's background ("we broke up in July") is what the chat doesn't
 * show: every prompt that gets it has to say so, so the model reads the chat
 * with it but never quotes it back as if someone had written it there.
 */

const digest = {
  participants: [
    { alias: "Person A", messages: 2 },
    { alias: "Person B", messages: 1 },
  ],
  totalMessages: 3,
  firstDate: "2026-01-01",
  lastDate: "2026-01-02",
  transcript: [
    "2026-01-01 12:00 Person A: are we still on for friday?",
    "2026-01-01 12:05 Person B: sure",
    "2026-01-02 09:00 Person A: ok",
  ].join("\n"),
};

const BACKGROUND = "We broke up in July. Person B is long distance now.";

/** The two things every prompt with a background must hold. */
const assertBackground = (text) => {
  assert.ok(
    text.includes(`background the chat itself doesn't show: "${BACKGROUND}"`),
    "the background, marked as not from the chat",
  );
  assert.match(text, /never quote it as a message/);
  assert.match(text, /never present it as something anyone said or did/);
};

const assertNoBackground = (text) => {
  assert.doesNotMatch(text, /background/i);
};

test("the report is told the background, and not to quote it as the chat", () => {
  const { system, prompt } = buildPrompt(digest, "en", undefined, {
    background: BACKGROUND,
  });
  assertBackground(system);
  // Background only: no question, so no answer.
  assert.match(system, /Leave "answer" empty/);
  // The excerpts stay the chat's own, with nothing of the reader's mixed in.
  assert.ok(!prompt.includes(BACKGROUND));
  assert.ok(prompt.includes(digest.transcript));
});

test("the background goes with a question and who the reader is", () => {
  const { system } = buildPrompt(digest, "de", undefined, {
    me: "Person A",
    question: "Is Person B still into me?",
    background: BACKGROUND,
  });
  assert.match(system, /The reader is Person A\./);
  assert.match(system, /The reader asks: "Is Person B still into me\?"/);
  assertBackground(system);
  assert.match(system, /Answer the reader's question in "answer"/);
  assert.match(system, /Write every field in German\./);
});

test("on device, the notes and the separate answer get it too", () => {
  const ask = { question: "Why did it end?", background: BACKGROUND };
  assertBackground(buildNotesPrompt(digest, "part", 0, 2, ask).system);
  assertBackground(
    buildAnswerPrompt(digest, "en", ["note"], { ...ask, question: "Why?" })
      .system,
  );
});

test("no background, no mention of one", () => {
  assertNoBackground(buildPrompt(digest, "en").system);
  assertNoBackground(
    buildPrompt(digest, "en", undefined, { question: "Why?" }).system,
  );
  assertNoBackground(
    buildCoachPrompt(digest, "en", "ask", [{ role: "user", content: "Hi" }])
      .system,
  );
});

for (const kind of ["ask", "reply"]) {
  test(`the coach (${kind}) is told the same background`, () => {
    const { system, messages } = buildCoachPrompt(
      digest,
      "en",
      kind,
      [{ role: "user", content: "what should I say?" }],
      {
        me: "Person A",
        context: "They plan Fridays.",
        background: BACKGROUND,
      },
    );
    assertBackground(system);
    assert.match(system, /An earlier analysis said: They plan Fridays\./);
    // Before the chat itself, so it reads as the frame for the excerpts.
    assert.ok(system.indexOf(BACKGROUND) < system.indexOf(digest.transcript));
    // The conversation carries only what the reader sent, never the background.
    assert.ok(messages.every((m) => !m.content.includes(BACKGROUND)));
  });
}
