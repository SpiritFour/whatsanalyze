// Run with `npm test` in functions/ (Node 22 strips the TypeScript types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, toPreview } from "../src/ai/preview.ts";

const item = (title) => ({ title, description: `${title} detail` });
const full = {
  answer: "Yes, they are.",
  summary: "Two friends planning trips.",
  vibe: "Travel buddies",
  topics: [item("Trips"), item("Food"), item("Work")],
  people: [
    { name: "Person A", role: "Planner", style: "Long messages." },
    { name: "Person B", role: "Joker", style: "Memes." },
  ],
  dynamics: [item("A starts"), item("Warm"), item("Teasing")],
  highlights: ["The lost passport", "The birthday cake"],
};

test("toPreview keeps the verdict and a taste of each section, and counts the rest", () => {
  const { insights, locked } = toPreview(full);
  assert.equal(insights.answer, full.answer);
  assert.equal(insights.summary, full.summary);
  assert.equal(insights.vibe, full.vibe);
  assert.deepEqual(insights.dynamics, full.dynamics.slice(0, 2));
  assert.deepEqual(insights.people, full.people.slice(0, 1));
  assert.deepEqual(insights.topics, full.topics.slice(0, 2));
  assert.deepEqual(insights.highlights, full.highlights.slice(0, 1));
  assert.deepEqual(locked, {
    people: 1,
    dynamics: 1,
    topics: 1,
    highlights: 1,
  });
});

test("toPreview never reports negative locked findings", () => {
  const { locked } = toPreview({
    ...full,
    people: [],
    dynamics: [item("Only one")],
    topics: [],
    highlights: [],
  });
  assert.equal(locked.people, 0);
  assert.equal(locked.dynamics, 0);
  assert.equal(locked.topics, 0);
  assert.equal(locked.highlights, 0);
});

test("clientIp takes the hop Google appended, not a spoofed one", () => {
  assert.equal(clientIp("6.6.6.6, 1.2.3.4", "9.9.9.9"), "1.2.3.4");
  assert.equal(clientIp(["5.6.7.8"], undefined), "5.6.7.8");
  assert.equal(clientIp(undefined, "9.9.9.9"), "9.9.9.9");
  assert.equal(clientIp("", undefined), "unknown");
});
