import type { ChatInsights, CoachKind } from "~/functions/src/ai/insights";
import { AI_QUESTIONS } from "~/utils/ai/questions";

/**
 * The sample chat ("Try With Sample Chat"): Emma and Leo, made up from start
 * to finish (scripts/sample-chat/). Its AI readings were made once, in every
 * language, for every ready-made question and from both sides, and ship with
 * the site. Trying the AI on it costs nothing and leaves the visitor's free
 * preview for their own chat.
 */
// static/chat_example.txt, the sample before November 2026, stays for a while
// for copies of the site cached before then: they still fetch it. It can go
// once those have updated, after January 2027.
export const SAMPLE_CHAT_URL = "/sample/chat.txt";
export const SAMPLE_CHAT_NAME = "Sample WhatsApp Chat (Emma & Leo)";

export interface SampleCoachTurn {
  id: string;
  kind: CoachKind;
  /** Whose side the question or draft is from, if anyone's. */
  me: string | null;
  prompt: string;
  reply: string;
}

export interface SampleReadings {
  /** The chat they were made from, to tell if it has changed since. */
  chat: { messages: number; from: string; to: string };
  model: string;
  /** By sampleReadingKey; names are already the real ones. */
  readings: Record<string, ChatInsights>;
  coach: SampleCoachTurn[];
}

/**
 * Which reading answers a question: the ready-made ones that ask who "I" am
 * have one per person, the rest one for everyone. A question of the
 * visitor's own has none.
 */
export function sampleReadingKey(
  question: string | null,
  me: string | null,
): string | null {
  if (!question) return "none";
  const preset = AI_QUESTIONS.find((q) => q.id === question);
  if (!preset) return null;
  return preset.needsMe ? `${preset.id}:${me}` : preset.id;
}

const loaded = new Map<string, Promise<SampleReadings | null>>();

/** The readings in one language, fetched once; null if they can't be. */
export function loadSampleReadings(
  language: string,
): Promise<SampleReadings | null> {
  if (!loaded.has(language)) {
    loaded.set(
      language,
      fetch(`/sample/ai/${language}.json`)
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
    );
  }
  return loaded.get(language)!;
}

/**
 * Is this the chat the readings were made from? A sample file that changed
 * without its readings being made again would get answers about another
 * chat; then the sample just runs like any other chat.
 */
export const matchesSample = (
  readings: SampleReadings,
  digest: { totalMessages: number; firstDate: string; lastDate: string },
) =>
  readings.chat.messages === digest.totalMessages &&
  readings.chat.from === digest.firstDate &&
  readings.chat.to === digest.lastDate;

/** How long the sample "reads": long enough to feel what the real wait is. */
export const SAMPLE_READING_MS = 9_000;
export const SAMPLE_COACH_MS = 2_500;
