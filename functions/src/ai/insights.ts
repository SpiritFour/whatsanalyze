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

const item = z.object({
  title: z.string().describe("A few words"),
  description: z.string().describe("One or two sentences"),
});

export const insightsSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-3 sentences: what this chat is about and its overall tone. Don't restate message counts or dates.",
    ),
  vibe: z
    .string()
    .describe("A short, playful label for this chat's vibe, at most 4 words"),
  topics: z.array(item).describe("The 3-5 topics that come up most"),
  people: z
    .array(
      z.object({
        name: z
          .string()
          .describe('The participant\'s placeholder exactly, e.g. "Person A"'),
        role: z
          .string()
          .describe("The role they play in this chat, at most 4 words"),
        style: z.string().describe("One sentence on how they write"),
      }),
    )
    .describe("One entry per participant, at most 8"),
  dynamics: z
    .array(item)
    .describe(
      "2-4 observations about how they interact: who initiates, balance, warmth, conflict",
    ),
  highlights: z
    .array(z.string())
    .describe("2-3 memorable, funny or touching moments, one sentence each"),
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

/**
 * The analysis itself. Given `notes`, it works from those instead of the
 * transcript: that is how a small on-device model covers more of a chat than
 * fits in its context (see buildNotesPrompt).
 */
export function buildPrompt(
  digest: ChatDigest,
  language: AiLanguage,
  notes?: string[],
): { system: string; prompt: string } {
  const system = [
    "You analyze exported WhatsApp chats for the people who took part in them.",
    "Be specific: refer to things that actually happen in the chat, not generic relationship advice.",
    "Be warm and a little playful, never judgmental. Do not diagnose anyone.",
    'Refer to participants only by their placeholder ("Person A", "Person B", ...), exactly as written and untranslated.',
    "Text in square brackets ([phone], [email], [link]) was removed for privacy; ignore it.",
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
): { system: string; prompt: string } {
  const system = [
    "You read one part of an exported WhatsApp chat and take notes for a later analysis.",
    "In at most 120 words, note: the topics, how each participant writes and behaves, and any memorable, funny or touching moment (with its date).",
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
