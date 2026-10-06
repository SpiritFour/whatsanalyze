import { z } from "zod";

/**
 * What an AI chat analysis asks for and what it returns.
 *
 * Shared, unchanged, by both places an analysis can run: the cloud function
 * (analyzeChatAi.ts) and the on-device model in the browser
 * (utils/ai/localModel.ts imports this file directly). One prompt and one
 * schema means the results page cannot tell which model wrote the answer, and
 * a prompt fix lands in both. Keep it free of Node and browser APIs.
 */

export const AI_LANGUAGES = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
} as const;

export type AiLanguage = keyof typeof AI_LANGUAGES;

/**
 * The most transcript the cloud accepts: ~130k tokens, roughly 10,000
 * messages, which is all of most chats. Kept under the 272k-token mark where
 * OpenAI's long-context pricing doubles the input rate.
 */
export const CLOUD_TRANSCRIPT_CHARS = 400_000;

/**
 * What the browser has already reduced the chat to. Participants are
 * placeholders ("Person A"), never real names: the real ones stay on the
 * device and are put back into the answer there.
 */
export interface ChatDigest {
  participants: { alias: string; messages: number }[];
  totalMessages: number;
  /** ISO dates of the first and last message. */
  firstDate: string;
  lastDate: string;
  /** Excerpts, oldest first, one "YYYY-MM-DD HH:MM alias: text" per line. */
  transcript: string;
}

/**
 * What the reader wants to know, optionally. `me` is their placeholder when
 * they said which participant they are; `question` is already anonymized.
 */
export interface AiAsk {
  question?: string;
  me?: string;
}

export const MAX_QUESTION_CHARS = 300;

const item = z.object({
  title: z.string().describe("A few words"),
  description: z
    .string()
    .describe("One or two sentences with a concrete detail from the chat"),
});

export const insightsSchema = z.object({
  answer: z
    .string()
    .describe(
      "Only if the reader asked a question: a direct, honest and kind answer in 3-6 sentences, backed by specific moments from the chat. Otherwise an empty string.",
    ),
  summary: z
    .string()
    .describe(
      "2-3 sentences: what this chat is about and its overall tone. No message counts or dates.",
    ),
  vibe: z.string().describe("A playful label for this chat, 2-4 words"),
  topics: z
    .array(item)
    .describe(
      "3-5 distinct subjects they talk about, each named after what it is about. A topic is a subject, never one person's messages.",
    ),
  people: z
    .array(
      z.object({
        name: z
          .string()
          .describe('The participant\'s placeholder exactly, e.g. "Person A"'),
        role: z.string().describe("Their role in this chat, 2-4 words"),
        style: z
          .string()
          .describe(
            "One sentence on how they write that sets them apart from the others",
          ),
      }),
    )
    .describe("One entry per participant, at most 8"),
  dynamics: z
    .array(item)
    .describe(
      "2-4 observations about how they interact, each about a different aspect: who initiates, balance, warmth, humour, conflict",
    ),
  highlights: z
    .array(z.string())
    .describe(
      "2-3 specific memorable, funny or touching moments, each saying what actually happened",
    ),
});

export type ChatInsights = z.infer<typeof insightsSchema>;

const overview = (digest: ChatDigest) => {
  const participants = digest.participants
    .map((p) => `- ${p.alias}: ${p.messages} messages`)
    .join("\n");
  return [
    `The chat runs from ${digest.firstDate} to ${digest.lastDate} with ${digest.totalMessages} messages.`,
    `Participants:\n${participants}`,
  ];
};

const askLines = (ask: AiAsk | undefined) => [
  ...(ask?.me
    ? [
        `The reader is ${ask.me}. Address them as "you" and everyone else by placeholder.`,
      ]
    : []),
  ...(ask?.question ? [`The reader asks: "${ask.question}"`] : []),
];

/**
 * The analysis itself. Given `notes`, it works from those instead of the
 * transcript: that is how a small on-device model covers more of a chat than
 * fits in its context (see buildNotesPrompt).
 */
export function buildPrompt(
  digest: ChatDigest,
  language: AiLanguage,
  notes?: string[],
  ask?: AiAsk,
): { system: string; prompt: string } {
  const system = [
    "You analyze exported WhatsApp chats for the people who took part in them.",
    "Be specific: name concrete things that happen in the chat. No generic relationship advice.",
    "Every item must add something new. Never repeat a point, and never write the same item once per person.",
    "Be warm and a little playful, never judgmental. Do not diagnose anyone.",
    'Refer to participants only by their placeholder ("Person A", "Person B", ...), exactly as written and untranslated.',
    "Text in square brackets ([phone], [email], [link]) was removed for privacy; ignore it.",
    ...askLines(ask),
    ask?.question
      ? "Answer the reader's question in \"answer\". If the chat doesn't give enough to go on, say so honestly."
      : 'Leave "answer" empty.',
    `Write every field in ${AI_LANGUAGES[language]}.`,
  ].join("\n");

  const body = notes
    ? [
        `Notes taken while reading the chat in ${notes.length} parts, oldest first:`,
        notes.map((n, i) => `Part ${i + 1}:\n${n}`).join("\n\n"),
      ]
    : [
        "Excerpts sampled across the whole chat, oldest first:",
        digest.transcript,
      ];

  return { system, prompt: [...overview(digest), ...body].join("\n\n") };
}

/** One part of a chunked read: short notes for buildPrompt to work from. */
export function buildNotesPrompt(
  digest: ChatDigest,
  part: string,
  index: number,
  total: number,
  ask?: AiAsk,
): { system: string; prompt: string } {
  const system = [
    "You read one part of an exported WhatsApp chat and take notes for a later analysis.",
    "In at most 120 words, note: what they talk about (concrete subjects), how each participant writes and behaves, and any memorable, funny or touching moment with its date. Quote short phrases where they help.",
    ...(ask?.question
      ? [
          "Also note anything in this part that helps answer the reader's question.",
        ]
      : []),
    ...askLines(ask),
    'Refer to participants only by their placeholder ("Person A", "Person B", ...), exactly as written.',
    "Write the notes in English, as short plain sentences. No preamble.",
  ].join("\n");

  const prompt = [
    ...overview(digest),
    `Part ${index + 1} of ${total}, oldest first:`,
    part,
  ].join("\n\n");

  return { system, prompt };
}

/**
 * The reader's question on its own, as plain text. A 1B model asked for the
 * answer inside the full report filled it with the rest of the report, so
 * on device the answer is a separate, simpler call.
 */
export function buildAnswerPrompt(
  digest: ChatDigest,
  language: AiLanguage,
  notes: string[] | undefined,
  ask: AiAsk & { question: string },
): { system: string; prompt: string } {
  const { prompt } = buildPrompt(digest, language, notes);
  const system = [
    "You answer one question about an exported WhatsApp chat for someone who took part in it.",
    "Answer in 3-6 sentences: direct, honest and kind, backed by specific moments from the chat. If the chat doesn't give enough to go on, say so.",
    'Refer to participants only by their placeholder ("Person A", "Person B", ...), exactly as written and untranslated.',
    ...askLines(ask),
    `Write the answer in ${AI_LANGUAGES[language]}, as plain text without headings.`,
  ].join("\n");
  return { system, prompt };
}
