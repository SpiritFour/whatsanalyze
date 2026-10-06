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
 * The most transcript the cloud accepts. ~20k tokens: enough for a few hundred
 * messages sampled across the whole chat, and keeps one analysis at a few
 * cents whichever provider runs it.
 */
export const CLOUD_TRANSCRIPT_CHARS = 60_000;

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
    .describe("2-3 sentences: what this chat is about and its overall tone"),
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

export function buildPrompt(
  digest: ChatDigest,
  language: AiLanguage,
): { system: string; prompt: string } {
  const system = [
    "You analyze exported WhatsApp chats for the people who took part in them.",
    "Be specific: refer to things that actually happen in the excerpts, not generic relationship advice.",
    "Be warm and a little playful, never judgmental. Do not diagnose anyone.",
    'Refer to participants only by their placeholder ("Person A", "Person B", ...), exactly as written and untranslated.',
    "Text in square brackets ([phone], [email], [link]) was removed for privacy; ignore it.",
    `Write every field in ${AI_LANGUAGES[language]}.`,
  ].join("\n");

  const participants = digest.participants
    .map((p) => `- ${p.alias}: ${p.messages} messages`)
    .join("\n");

  const prompt = [
    `The chat runs from ${digest.firstDate} to ${digest.lastDate} with ${digest.totalMessages} messages.`,
    `Participants:\n${participants}`,
    "Excerpts sampled across the whole chat, oldest first:",
    digest.transcript,
  ].join("\n\n");

  return { system, prompt };
}
