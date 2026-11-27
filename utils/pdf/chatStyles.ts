/**
 * The looks the chat-to-PDF tool offers. Each is a palette plus a bubble
 * shape; the markup is the same for all of them (utils/pdf/chatView.ts).
 *
 * Colours are plain hex: the PDF emitter reproduces solid fills only, so a
 * style may not rely on gradients, shadows or translucency.
 */

export type PresetStyleId =
  "iphone-light" | "iphone-dark" | "android-light" | "android-dark" | "ink";

/** A preset, or "custom": a palette derived from four chosen colours (Pro). */
export type ChatStyleId = PresetStyleId | "custom";

export interface ChatStyle {
  id: ChatStyleId;
  /** Page and chat wallpaper. */
  page: string;
  /** The bar at the top of the chat, like a phone's chat header. */
  header: string;
  headerText: string;
  headerMuted: string;
  bubbleIn: string;
  bubbleOut: string;
  text: string;
  /** Timestamps and other secondary text inside bubbles. */
  muted: string;
  dayBackground: string;
  dayText: string;
  systemBackground: string;
  systemText: string;
  /** Page numbers on the margin. */
  folio: string;
  /** Bubble corner radius in px. */
  radius: number;
  /** Day labels as a pill (iPhone) or a squarer chip (Android). */
  dayRadius: number;
  /** Whether participant colours are used for names (off for ink saver). */
  colorNames: boolean;
  /** Fallback name colour when colours are off or missing. */
  name: string;
  /** Text and secondary text on outgoing bubbles, when they differ. */
  textOut?: string;
  mutedOut?: string;
  /** Highlight colour of a custom style (cover, outro). */
  accent?: string;
}

/** The four colours a custom style is made from. */
export interface CustomColors {
  page: string;
  bubbleIn: string;
  bubbleOut: string;
  accent: string;
}

export interface WallpaperChoice {
  kind: "none" | "pattern" | "photo";
  pattern: "dots" | "hearts" | "stars" | "grid" | "waves" | "confetti";
  /** How far a photo is faded towards the page colour, 0–0.9. */
  dim: number;
}

export interface CoverChoice {
  /** Replaces the chat's name on the cover; empty keeps it. */
  title: string;
  /** A line or two under the title, e.g. "For our 5th anniversary". */
  dedication: string;
  /** Cover background; null uses the style's page colour. */
  color: string | null;
  /** Whether a cover photo is set (the image itself is kept separately). */
  photo: boolean;
}

export const CHAT_STYLES: Record<PresetStyleId, ChatStyle> = {
  "iphone-light": {
    id: "iphone-light",
    page: "#efeae2",
    header: "#f6f6f6",
    headerText: "#111b21",
    headerMuted: "#667781",
    bubbleIn: "#ffffff",
    bubbleOut: "#d9fdd3",
    text: "#111b21",
    muted: "#667781",
    dayBackground: "#ffffff",
    dayText: "#54656f",
    systemBackground: "#fff3c4",
    systemText: "#54656f",
    folio: "#667781",
    radius: 16,
    dayRadius: 12,
    colorNames: true,
    name: "#1f7aec",
  },
  "iphone-dark": {
    id: "iphone-dark",
    page: "#0b0b0b",
    header: "#1c1c1e",
    headerText: "#f2f2f7",
    headerMuted: "#98989f",
    bubbleIn: "#262628",
    bubbleOut: "#005c4b",
    text: "#e9edef",
    muted: "#a3adb4",
    dayBackground: "#1c1c1e",
    dayText: "#c7c7cc",
    systemBackground: "#2c2a1e",
    systemText: "#e6d38a",
    folio: "#8e8e93",
    radius: 16,
    dayRadius: 12,
    colorNames: true,
    name: "#53bdeb",
  },
  "android-light": {
    id: "android-light",
    page: "#efeae2",
    header: "#008069",
    headerText: "#ffffff",
    headerMuted: "#d8f1eb",
    bubbleIn: "#ffffff",
    bubbleOut: "#e7ffdb",
    text: "#111b21",
    muted: "#667781",
    dayBackground: "#e1f2fb",
    dayText: "#54656f",
    systemBackground: "#ffeecd",
    systemText: "#54656f",
    folio: "#667781",
    radius: 8,
    dayRadius: 6,
    colorNames: true,
    name: "#1f7aec",
  },
  "android-dark": {
    id: "android-dark",
    page: "#0b141a",
    header: "#1f2c34",
    headerText: "#e9edef",
    headerMuted: "#8696a0",
    bubbleIn: "#202c33",
    bubbleOut: "#005c4b",
    text: "#e9edef",
    muted: "#8696a0",
    dayBackground: "#182229",
    dayText: "#8696a0",
    systemBackground: "#182229",
    systemText: "#ffd279",
    folio: "#8696a0",
    radius: 8,
    dayRadius: 6,
    colorNames: true,
    name: "#53bdeb",
  },
  // For paper: white page, light gray bubbles, black text. No wallpaper to
  // spend toner on, and it survives a black-and-white printer.
  ink: {
    id: "ink",
    page: "#ffffff",
    header: "#ffffff",
    headerText: "#000000",
    headerMuted: "#555555",
    bubbleIn: "#f1f1f1",
    bubbleOut: "#e2e2e2",
    text: "#000000",
    muted: "#555555",
    dayBackground: "#ffffff",
    dayText: "#555555",
    systemBackground: "#ffffff",
    systemText: "#555555",
    folio: "#777777",
    radius: 6,
    dayRadius: 4,
    colorNames: false,
    name: "#000000",
  },
};

export const CHAT_STYLE_IDS = Object.keys(CHAT_STYLES) as PresetStyleId[];

export type TextSize = "s" | "m" | "l";

/** Message text size in px; everything else scales from it. */
export const TEXT_SIZES: Record<TextSize, number> = { s: 12, m: 13.5, l: 15 };

export interface ChatViewOptions {
  style: ChatStyleId;
  textSize: TextSize;
  showTimes: boolean;
  showMedia: boolean;
  /** Names above incoming messages; on by default in group chats. */
  showNames: boolean;
  /** The participant whose messages go on the right. */
  me: string;
  /** The preset a custom style started from, and falls back to without Pro. */
  baseStyle: PresetStyleId;
  /** Used when `style` is "custom". */
  colors: CustomColors;
  wallpaper: WallpaperChoice;
  cover: CoverChoice;
}

export const DEFAULT_CHAT_VIEW_OPTIONS: Omit<ChatViewOptions, "me"> = {
  style: "iphone-light",
  textSize: "m",
  showTimes: true,
  showMedia: true,
  showNames: false,
  baseStyle: "iphone-light",
  colors: {
    page: "#f3e8ff",
    bubbleIn: "#ffffff",
    bubbleOut: "#e9d5ff",
    accent: "#7c3aed",
  },
  wallpaper: { kind: "none", pattern: "dots", dim: 0.55 },
  cover: { title: "", dedication: "", color: null, photo: false },
};

const PATTERNS = ["dots", "hearts", "stars", "grid", "waves", "confetti"];

/** Validates options read back from storage or a URL. */
export function normalizeChatViewOptions(
  value: Partial<ChatViewOptions> | null | undefined,
  me: string,
): ChatViewOptions {
  const defaults = DEFAULT_CHAT_VIEW_OPTIONS;
  const options: ChatViewOptions = {
    ...defaults,
    me,
    ...(value || {}),
    colors: { ...defaults.colors, ...(value?.colors || {}) },
    wallpaper: { ...defaults.wallpaper, ...(value?.wallpaper || {}) },
    cover: { ...defaults.cover, ...(value?.cover || {}) },
  };
  if (options.style !== "custom" && !CHAT_STYLE_IDS.includes(options.style)) {
    options.style = defaults.style;
  }
  if (!CHAT_STYLE_IDS.includes(options.baseStyle)) {
    options.baseStyle = defaults.baseStyle;
  }
  if (!(options.textSize in TEXT_SIZES)) {
    options.textSize = defaults.textSize;
  }
  if (!["none", "pattern", "photo"].includes(options.wallpaper.kind)) {
    options.wallpaper.kind = "none";
  }
  if (!PATTERNS.includes(options.wallpaper.pattern)) {
    options.wallpaper.pattern = "dots";
  }
  options.wallpaper.dim = Math.max(
    0,
    Math.min(0.9, Number(options.wallpaper.dim) || 0),
  );
  return options;
}
