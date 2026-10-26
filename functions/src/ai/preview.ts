import type { ChatInsights } from "./insights";

/**
 * The free cloud preview for visitors without a subscription: the verdict
 * (summary, vibe, the answer to their question) plus a taste of each section,
 * enough to feel real. The rest is cut here, on the server, so it never
 * reaches the browser; only how much was cut goes back, so the page can show
 * that many blurred cards.
 *
 * Kept free of Firebase imports so it can be tested on its own
 * (preview.test.ts).
 */

/** How many of each section the preview keeps; people are all locked. */
export const PREVIEW_KEEP = { dynamics: 2, topics: 2, highlights: 1 };

export interface PreviewLocked {
  people: number;
  topics: number;
  dynamics: number;
  highlights: number;
}

export function toPreview(insights: ChatInsights): {
  insights: ChatInsights;
  locked: PreviewLocked;
} {
  const { dynamics, topics, highlights } = PREVIEW_KEEP;
  return {
    insights: {
      ...insights,
      people: [],
      dynamics: insights.dynamics.slice(0, dynamics),
      topics: insights.topics.slice(0, topics),
      highlights: insights.highlights.slice(0, highlights),
    },
    locked: {
      people: insights.people.length,
      dynamics: Math.max(0, insights.dynamics.length - dynamics),
      topics: Math.max(0, insights.topics.length - topics),
      highlights: Math.max(0, insights.highlights.length - highlights),
    },
  };
}

/**
 * The visitor's IP: the last X-Forwarded-For hop, the one Google's front end
 * appends (earlier hops are whatever the caller sent, so they'd let anyone
 * reset the per-IP cap), else the socket's. Only ever stored hashed.
 */
export function clientIp(
  forwardedFor: string | string[] | undefined,
  fallback: string | undefined,
): string {
  const header = Array.isArray(forwardedFor)
    ? forwardedFor[forwardedFor.length - 1]
    : forwardedFor;
  return header?.split(",").pop()?.trim() || fallback || "unknown";
}
