/**
 * Makes the sample chat's AI readings, once: every ready-made question (from
 * both sides, where it asks who "I" am) and the coach's suggestions, in every
 * language. Each is asked exactly as a subscriber's full cloud report would
 * be: the site's own parser and anonymized digest, the functions' prompts,
 * and production's model and effort (functions/.env.whatsanalyze-80665).
 *
 * Writes static/sample/ai/<language>.json, which the AI page shows for the
 * sample chat instead of asking the cloud (utils/ai/sample.ts). The site
 * ships the hand-polished readings instead (polish.mjs, polished/): run
 * that afterwards, or these replace them.
 *
 * usage: AI_API_KEY=… node scripts/sample-chat/readings.mjs [language…]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SAMPLE_COACH } from "./coach.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const apiKey = process.env.AI_API_KEY;
if (!apiKey) {
  console.error("AI_API_KEY is not set: the provider key the functions use.");
  process.exit(1);
}

// The site's own code, TypeScript and "~/" imports included, through the
// jiti that Nuxt already ships.
const nuxtRequire = createRequire(
  createRequire(import.meta.url).resolve("nuxt/package.json"),
);
const jiti = nuxtRequire("jiti").createJiti(import.meta.url, {
  alias: { "~": ROOT, "@": ROOT },
});
const site = (path) => jiti.import(join(ROOT, path));
const { parseChatFile } = await site("composables/useChatTool.ts");
const { buildDigest, restoreNames } = await site("utils/ai/digest.js");
const { AI_QUESTIONS } = await site("utils/ai/questions.js");
const { messages: translations } = await site("utils/translations.js");
const {
  AI_LANGUAGES,
  CLOUD_TRANSCRIPT_CHARS,
  COACH_SAFETY,
  MAX_COACH_CHARS,
  MAX_COACH_REPLY_CHARS,
  MAX_QUESTION_CHARS,
  buildCoachPrompt,
  buildPrompt,
  insightsSchema,
} = await site("functions/src/ai/insights.ts");

// And the functions' own AI SDK, the version production runs.
const functionsRequire = createRequire(join(ROOT, "functions/package.json"));
const sdk = (name) =>
  import(pathToFileURL(functionsRequire.resolve(name)).href);
const { generateText, Output } = await sdk("ai");
const { createOpenAI } = await sdk("@ai-sdk/openai");
const { createAnthropic } = await sdk("@ai-sdk/anthropic");

const env = Object.fromEntries(
  readFileSync(join(ROOT, "functions/.env.whatsanalyze-80665"), "utf8")
    .split("\n")
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1),
    ]),
);
const MODEL = env.AI_MODEL;
const EFFORT = env.AI_REASONING_EFFORT;
const [provider, modelId] = [
  MODEL.slice(0, MODEL.indexOf(":")),
  MODEL.slice(MODEL.indexOf(":") + 1),
];
const model =
  provider === "anthropic"
    ? createAnthropic({ apiKey })(modelId)
    : createOpenAI({ apiKey })(modelId);
const providerOptions = {
  openai: { reasoningEffort: EFFORT, store: false },
  anthropic: { effort: EFFORT },
};

const { messages } = await parseChatFile(
  readFileSync(join(ROOT, "static/sample/chat.txt"), "utf8"),
);
const { digest, names, anonymize } = buildDigest(
  messages,
  CLOUD_TRANSCRIPT_CHARS,
);
const aliasOf = (person) =>
  Object.keys(names).find((alias) => names[alias] === person);
const people = Object.values(names);

/** Retry a provider hiccup a couple of times before giving up. */
async function attempt(label, run) {
  for (let tries = 1; ; tries++) {
    try {
      const started = Date.now();
      const result = await run();
      console.log(
        `  ✓ ${label} (${Math.round((Date.now() - started) / 1000)} s)`,
      );
      return result;
    } catch (error) {
      if (tries === 3) {
        throw new Error(`${label}: ${error.message}`, { cause: error });
      }
      console.log(`  … ${label} failed (${error.message}), again`);
    }
  }
}

async function reading(language, question, me) {
  const alias = me ? aliasOf(me) : undefined;
  const label = question
    ? translations[language].toolsAi[`ask_${question}`]
    : "";
  const asked = label
    ? anonymize(label).slice(0, MAX_QUESTION_CHARS)
    : undefined;
  const ask = alias || asked ? { me: alias, question: asked } : undefined;
  const { system, prompt } = buildPrompt(digest, language, undefined, ask);
  const { output } = await generateText({
    model,
    system,
    prompt,
    output: Output.object({ schema: insightsSchema }),
    maxOutputTokens: 8_000,
    providerOptions,
  });
  return restoreNames(output, names);
}

async function coachReply(language, turn, summary) {
  const alias = turn.me ? aliasOf(turn.me) : undefined;
  const history = [
    {
      role: "user",
      content: anonymize(turn.prompt[language]).slice(0, MAX_COACH_CHARS),
    },
  ];
  const { system, messages: prompt } = buildCoachPrompt(
    digest,
    language,
    turn.kind,
    history,
    {
      me: alias,
      context: anonymize(summary).slice(0, MAX_COACH_REPLY_CHARS),
    },
  );
  const { text } = await generateText({
    model,
    system,
    messages: prompt,
    maxOutputTokens: 4_000,
    providerOptions,
  });
  if (text.includes(COACH_SAFETY)) throw new Error("safety handover");
  return restoreNames(text, names);
}

async function readingsIn(language) {
  console.log(`${language}:`);
  const jobs = [["none", null, null]];
  for (const { id, needsMe } of AI_QUESTIONS) {
    if (!needsMe) jobs.push([id, id, null]);
    else
      for (const person of people) jobs.push([`${id}:${person}`, id, person]);
  }
  const done = await Promise.all(
    jobs.map(([key, question, me]) =>
      attempt(`${language} ${key}`, () => reading(language, question, me)).then(
        (result) => [key, result],
      ),
    ),
  );
  const readings = Object.fromEntries(done);
  // The coach picks up from the report it sits under; "better" is the one
  // the situation pages that lead to it open with.
  const coach = await Promise.all(
    SAMPLE_COACH.map((turn) =>
      attempt(`${language} coach ${turn.id}`, () =>
        coachReply(language, turn, readings.better.summary),
      ).then((reply) => ({
        id: turn.id,
        kind: turn.kind,
        me: turn.me,
        prompt: turn.prompt[language],
        reply,
      })),
    ),
  );
  const out = join(ROOT, `static/sample/ai/${language}.json`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    `${JSON.stringify(
      {
        chat: {
          messages: digest.totalMessages,
          from: digest.firstDate,
          to: digest.lastDate,
        },
        model: MODEL,
        readings,
        coach,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`  → ${out}`);
}

const languages = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(AI_LANGUAGES);
console.log(
  `${MODEL} (${EFFORT}), ${digest.totalMessages} messages, ${digest.transcript.length} characters`,
);
for (const language of languages) await readingsIn(language);
