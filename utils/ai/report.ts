import type { ChatInsights } from "~/functions/src/ai/insights";

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
  ranOn: "local" | "cloud";
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
