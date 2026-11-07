import type { ChatInsights } from "~/functions/src/ai/insights";
import type { PreviewLocked } from "~/functions/src/ai/preview";

/**
 * A finished AI report: what the page shows and what a share link carries.
 * Real names are already back in, so this is only ever built in the
 * reader's browser and shared on their say-so.
 */
export interface AiReport {
  kind: "ai";
  version: 1;
  insights: ChatInsights;
  /** The question as the reader asked it, if they asked one. */
  question: string;
  /**
   * What was asked, as the page knew it: the preset's id ("custom" for a
   * question of the reader's own, null for none), and whether the AI was
   * told who the reader is and wrote to them as "you". Whether a reading can
   * be sent to the other person rests on this (utils/ai/sendReading.js).
   * Missing on readings kept from before it was recorded.
   */
  asked?: { preset: string | null; toReader: boolean } | null;
  /** Set on a reading sent to the other person in the chat: by whom. */
  sentBy?: { from: string } | null;
  ranOn: "local" | "cloud";
  /** Set on a free cloud preview: what the full report would add. */
  locked?: PreviewLocked | null;
  coverage: {
    total: number;
    from: string;
    to: string;
    read: number;
    parts: number;
  } | null;
}

export const isAiReport = (value: any): value is AiReport =>
  value?.kind === "ai" &&
  value?.version === 1 &&
  typeof value?.insights?.summary === "string" &&
  Array.isArray(value?.insights?.people);
