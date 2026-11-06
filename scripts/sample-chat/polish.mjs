/**
 * Builds static/sample/ai/<language>.json from the hand-polished readings in
 * scripts/sample-chat/polished/: Claude Opus 5.5 rewrote the production
 * model's readings of the sample chat (readings.mjs) into the ones the site
 * shows. One reading per point of view (nobody's, Emma's, Leo's) carries the
 * answer to each question; the coach's answers go with its suggestions
 * (coach.mjs).
 *
 * Running readings.mjs again replaces these with the model's own; run this
 * afterwards to keep the polished ones.
 *
 * usage: node scripts/sample-chat/polish.mjs [language…]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLE_COACH } from "./coach.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const LANGUAGES = ["en", "de", "es", "fr", "pt", "it"];

// Which chat they are about, measured the way the page measures it
// (utils/ai/sample.ts), with the site's own parser and digest.
const nuxtRequire = createRequire(
  createRequire(import.meta.url).resolve("nuxt/package.json"),
);
const jiti = nuxtRequire("jiti").createJiti(import.meta.url, {
  alias: { "~": ROOT, "@": ROOT },
});
const { parseChatFile } = await jiti.import(
  join(ROOT, "composables/useChatTool.ts"),
);
const { buildDigest } = await jiti.import(join(ROOT, "utils/ai/digest.js"));
const { digest } = buildDigest(
  (
    await parseChatFile(
      readFileSync(join(ROOT, "static/sample/chat.txt"), "utf8"),
    )
  ).messages,
  400_000,
);
const chat = {
  messages: digest.totalMessages,
  from: digest.firstDate,
  to: digest.lastDate,
};

for (const language of process.argv.slice(2).length
  ? process.argv.slice(2)
  : LANGUAGES) {
  const { default: polished } = await import(`./polished/${language}.mjs`);
  const out = join(ROOT, `static/sample/ai/${language}.json`);

  const reading = (key, answer) => {
    const me = key.includes(":") ? key.split(":")[1] : "none";
    const { summary, vibe, topics, people, dynamics, highlights } =
      polished.bases[me];
    return { answer, summary, vibe, topics, people, dynamics, highlights };
  };
  const readings = {
    none: reading("none", ""),
    ...Object.fromEntries(
      Object.entries(polished.answers).map(([key, answer]) => [
        key,
        reading(key, answer),
      ]),
    ),
  };
  const coach = SAMPLE_COACH.map((turn) => ({
    id: turn.id,
    kind: turn.kind,
    me: turn.me,
    prompt: turn.prompt[language],
    reply: polished.coach[turn.id].replace("{why}", polished.why),
  }));

  writeFileSync(
    out,
    `${JSON.stringify(
      { chat, model: "claude-opus-5-5 (polished)", readings, coach },
      null,
      2,
    )}\n`,
  );
  console.log(`${language}: ${Object.keys(readings).length} readings → ${out}`);
}
