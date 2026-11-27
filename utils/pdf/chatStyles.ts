/**
 * The looks the chat-to-PDF tool offers. Each is a palette plus a bubble
 * shape; the markup is the same for all of them (utils/pdf/chatView.ts).
 *
 * Colours are plain hex: the PDF emitter reproduces solid fills only, so a
 * style may not rely on gradients, shadows or translucency.
 */

export type PresetStyleId =
  | "iphone-light"
  | "iphone-dark"
  | "android-light"
  | "android-dark"
  | "ink"
  | "romance"
  | "vintage"
  | "midnight"
  | "pastel"
  | "contrast";

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
  /** A Pro preset: printed with full access only. */
  pro?: boolean;
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
    headerMuted: "#5b6b75",
    bubbleIn: "#ffffff",
    bubbleOut: "#d9fdd3",
    text: "#111b21",
    mutedOut: "#4f6550",
    muted: "#667781",
    dayBackground: "#ffffff",
    dayText: "#54656f",
    systemBackground: "#fff3c4",
    systemText: "#54656f",
    folio: "#56656e",
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
    mutedOut: "#c4dfd8",
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
    headerMuted: "#eefaf6",
    bubbleIn: "#ffffff",
    bubbleOut: "#e7ffdb",
    text: "#111b21",
    mutedOut: "#506452",
    muted: "#667781",
    dayBackground: "#e1f2fb",
    dayText: "#54656f",
    systemBackground: "#ffeecd",
    systemText: "#54656f",
    folio: "#56656e",
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
    mutedOut: "#b9d8d1",
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
    folio: "#666666",
    radius: 6,
    dayRadius: 4,
    colorNames: false,
    name: "#000000",
  },

  // ----- Pro presets: moods rather than phones

  // Rose and blush, for anniversaries and the people who keep them.
  romance: {
    id: "romance",
    pro: true,
    page: "#fff1f2",
    header: "#ffe4e6",
    headerText: "#4c0519",
    headerMuted: "#7f3345",
    bubbleIn: "#ffffff",
    bubbleOut: "#fecdd3",
    text: "#3f0d1a",
    muted: "#8a4b5a",
    textOut: "#3f0d1a",
    mutedOut: "#6e2c3c",
    dayBackground: "#ffe4e6",
    dayText: "#881337",
    systemBackground: "#fff7ed",
    systemText: "#7c2d12",
    folio: "#7f4554",
    radius: 18,
    dayRadius: 12,
    colorNames: true,
    name: "#be123c",
    accent: "#e11d48",
  },
  // Sepia paper and ink, like letters kept in a box.
  vintage: {
    id: "vintage",
    pro: true,
    page: "#f4ecd8",
    header: "#e8dcc0",
    headerText: "#3b2f1e",
    headerMuted: "#55452c",
    bubbleIn: "#fbf6ea",
    bubbleOut: "#e6d5b0",
    text: "#2f2516",
    muted: "#5f4f35",
    mutedOut: "#4f4029",
    dayBackground: "#e8dcc0",
    dayText: "#4f4029",
    systemBackground: "#efe3c7",
    systemText: "#4f4029",
    folio: "#5a4a31",
    radius: 6,
    dayRadius: 4,
    colorNames: false,
    name: "#7c4a1e",
    accent: "#8b5e34",
  },
  // Deep navy and indigo: a dark theme that is not a phone's.
  midnight: {
    id: "midnight",
    pro: true,
    page: "#0f172a",
    header: "#1e293b",
    headerText: "#e2e8f0",
    headerMuted: "#a5b4c8",
    bubbleIn: "#1e293b",
    bubbleOut: "#3730a3",
    text: "#e2e8f0",
    muted: "#a5b4c8",
    textOut: "#eef2ff",
    mutedOut: "#d6dcfe",
    dayBackground: "#1e293b",
    dayText: "#cbd5e1",
    systemBackground: "#1e293b",
    systemText: "#fcd34d",
    folio: "#94a3b8",
    radius: 14,
    dayRadius: 10,
    colorNames: true,
    name: "#93c5fd",
    accent: "#818cf8",
  },
  // Sky, mint and lilac, soft and rounded.
  pastel: {
    id: "pastel",
    pro: true,
    page: "#f0f9ff",
    header: "#e0f2fe",
    headerText: "#0c4a6e",
    headerMuted: "#2f5a77",
    bubbleIn: "#ffffff",
    bubbleOut: "#dcfce7",
    text: "#1f2937",
    muted: "#57606d",
    mutedOut: "#3a5543",
    dayBackground: "#f3e8ff",
    dayText: "#6b21a8",
    systemBackground: "#fef9c3",
    systemText: "#713f12",
    folio: "#525b68",
    radius: 20,
    dayRadius: 14,
    colorNames: true,
    name: "#7c3aed",
    accent: "#0ea5e9",
  },
  // Black on white and white on black, for reading without glasses and for
  // the plainest possible printout.
  contrast: {
    id: "contrast",
    pro: true,
    page: "#ffffff",
    header: "#000000",
    headerText: "#ffffff",
    headerMuted: "#d4d4d4",
    bubbleIn: "#e5e5e5",
    bubbleOut: "#000000",
    text: "#000000",
    muted: "#333333",
    textOut: "#ffffff",
    mutedOut: "#d4d4d4",
    dayBackground: "#000000",
    dayText: "#ffffff",
    systemBackground: "#ffffff",
    systemText: "#000000",
    folio: "#333333",
    radius: 4,
    dayRadius: 2,
    colorNames: false,
    name: "#000000",
    accent: "#000000",
  },
};

export const CHAT_STYLE_IDS = Object.keys(CHAT_STYLES) as PresetStyleId[];

/** Whether a preset needs full access to print. */
export const isProStyle = (id: string) =>
  !!CHAT_STYLES[id as PresetStyleId]?.pro;

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
  /** The free preset a Pro style falls back to without full access. */
  baseStyle: PresetStyleId;
  /** Used when `style` is "custom". */
  colors: CustomColors;
  wallpaper: WallpaperChoice;
  cover: CoverChoice;
  /** Pro: "serif", "rounded" or "typewriter" instead of the default font. */
  font: "default" | "serif" | "rounded" | "typewriter";
  /** Sheet size: A4, US Letter or A5. */
  paper: PaperId;
  /** Pro: a chapter page per month, and the month on every page. */
  book: boolean;
  /** With `book`: quiet months continue on the page before. */
  bookCompact: boolean;
  /** Leave out WhatsApp's own notices (joins, encryption, missed calls). */
  hideSystem: boolean;
  /** Only messages from/to these days (YYYY-MM-DD), empty for no limit. */
  from: string;
  to: string;
  /** Pro: participants with an uploaded profile picture (kept separately). */
  avatars: string[];
}

export type PaperId = "a4" | "letter" | "a5";

/** Sheet sizes in millimetres. */
export const PAPER_SIZES: Record<
  PaperId,
  { widthMm: number; heightMm: number }
> = {
  a4: { widthMm: 210, heightMm: 297 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
  a5: { widthMm: 148, heightMm: 210 },
};

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
  font: "default",
  paper: "a4",
  book: false,
  bookCompact: false,
  hideSystem: false,
  from: "",
  to: "",
  avatars: [],
};

const FONTS = ["default", "serif", "rounded", "typewriter"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

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
  if (
    !CHAT_STYLE_IDS.includes(options.baseStyle) ||
    isProStyle(options.baseStyle)
  ) {
    options.baseStyle = defaults.baseStyle;
  }
  if (!(options.textSize in TEXT_SIZES)) {
    options.textSize = defaults.textSize;
  }
  if (!FONTS.includes(options.font)) options.font = "default";
  if (!(options.paper in PAPER_SIZES)) options.paper = "a4";
  options.book = !!options.book;
  options.bookCompact = !!options.bookCompact;
  options.hideSystem = !!options.hideSystem;
  options.avatars = Array.isArray(options.avatars)
    ? options.avatars.filter((name) => typeof name === "string")
    : [];
  if (!DAY.test(options.from)) options.from = "";
  if (!DAY.test(options.to)) options.to = "";
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
