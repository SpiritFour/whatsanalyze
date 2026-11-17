import type { Component, ComputedRef, InjectionKey } from "vue";
import { inject } from "vue";

/** One slide of the story, as pages/wrapped/results.vue lines them up. */
export interface StorySlide {
  /** What analytics calls it. */
  name: string;
  component: Component;
  props?: Record<string, unknown>;
  /** How long it stays up, where the default is too short to read it. */
  duration?: number;
}

/** What the carousel lets a slide do. */
export interface StoryControls {
  /** Hold the story until `resume` is called with the same reason. */
  pause(_reason: string): void;
  resume(_reason: string): void;
  next(): void;
}

/** What the results page tells every slide about this story. */
export interface StoryContext {
  /** Opened from someone's share link, not from the visitor's own upload. */
  isShared: ComputedRef<boolean>;
  /** The made-up sample chat. */
  isSample: ComputedRef<boolean>;
  /** The guesses so far, by question. */
  guesses: Record<string, { picked: string; right: boolean }>;
}

export const STORY_CONTROLS: InjectionKey<StoryControls> =
  Symbol("storyControls");
export const STORY_CONTEXT: InjectionKey<StoryContext> = Symbol("storyContext");

const noControls: StoryControls = {
  pause() {},
  resume() {},
  next() {},
};

/** The carousel's controls; harmless outside one. */
export const useStoryControls = () => inject(STORY_CONTROLS, noControls);
export const useStoryContext = () => inject(STORY_CONTEXT, null);

/**
 * A first name, short enough for a big headline. Exports carry names as they
 * are saved in the phone ("Emma Schneider 🌻 Work", "+49 151 …").
 */
export function shortName(name: string): string {
  const trimmed = name.replace(/‎/g, "").trim();
  // A phone number has no first name to cut it down to.
  if (/^[+\d][\d\s()-]+$/.test(trimmed)) return trimmed;
  const first = trimmed.split(/\s+/)[0] || trimmed;
  return first.length > 14 ? `${first.slice(0, 13)}…` : first;
}

/** "E." — for a card that should not name anyone. */
export function initial(name: string): string {
  const letter = [...shortName(name)].find((char) => /\p{L}|\p{N}/u.test(char));
  return letter ? `${letter.toUpperCase()}.` : "?";
}

function parseDay(day: string): Date | null {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return null;
  return new Date(year, month - 1, date);
}

/** "9 April" from "2026-04-09", in the reader's language. */
export function formatDay(
  day: string | null | undefined,
  locale: string,
  month: "long" | "short" = "long",
): string {
  const date = day ? parseDay(day) : null;
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month }).format(
    date,
  );
}

/** "8 AM", "08 Uhr", "8 h": the hour as that language writes it. */
export function formatHour(hour: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(
    new Date(2026, 0, 1, hour),
  );
}

export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Counts a number up from zero once the slide is on screen. */
export function countUp(
  target: number,
  onValue: (_value: number) => void,
  duration = 1400,
): () => void {
  if (
    typeof window === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    onValue(target);
    return () => {};
  }
  const start = performance.now();
  let frame = 0;
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    // Fast at first, settling into the final number.
    const eased = 1 - Math.pow(1 - progress, 4);
    onValue(Math.round(target * eased));
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/**
 * A heart counted as "❤" is a text character on its own: black on Android and
 * Windows, tiny on a canvas. The variation selector makes it the red emoji
 * everywhere; emoji that are pictures already are left alone.
 */
export function asEmoji(symbol: string | null | undefined): string {
  if (!symbol) return "";
  if (symbol.includes("\uFE0F") || /\p{Emoji_Presentation}/u.test(symbol)) {
    return symbol;
  }
  return `${symbol}\uFE0F`;
}
