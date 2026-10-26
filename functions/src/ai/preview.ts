import type { ChatInsights } from "./insights";

/**
 * The free cloud preview for visitors without a subscription: the verdict
 * (summary, vibe, the answer to their question) and two findings. The rest
 * is cut here, on the server, so it never reaches the browser; only how much
 * was cut goes back, for the "unlock" teaser.
 *
 * Kept free of Firebase imports so it can be tested on its own
 * (preview.test.ts).
 */

export const PREVIEW_FINDINGS = 2;

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
  return {
    insights: {
      ...insights,
      dynamics: insights.dynamics.slice(0, PREVIEW_FINDINGS),
      people: [],
      topics: [],
      highlights: [],
    },
    locked: {
      people: insights.people.length,
      topics: insights.topics.length,
      dynamics: Math.max(0, insights.dynamics.length - PREVIEW_FINDINGS),
      highlights: insights.highlights.length,
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
