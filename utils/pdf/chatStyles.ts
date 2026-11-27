/**
 * The looks the chat-to-PDF tool offers. Each is a palette plus a bubble
 * shape; the markup is the same for all of them (utils/pdf/chatView.ts).
 *
 * Colours are plain hex: the PDF emitter reproduces solid fills only, so a
 * style may not rely on gradients, shadows or translucency.
 */

export type ChatStyleId =
  "iphone-light" | "iphone-dark" | "android-light" | "android-dark" | "ink";

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
}

export const CHAT_STYLES: Record<ChatStyleId, ChatStyle> = {
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

export const CHAT_STYLE_IDS = Object.keys(CHAT_STYLES) as ChatStyleId[];

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
}

export const DEFAULT_CHAT_VIEW_OPTIONS: Omit<ChatViewOptions, "me"> = {
  style: "iphone-light",
  textSize: "m",
  showTimes: true,
  showMedia: true,
  showNames: false,
};

/** Validates options read back from storage or a URL. */
export function normalizeChatViewOptions(
  value: Partial<ChatViewOptions> | null | undefined,
  me: string,
): ChatViewOptions {
  const options = { ...DEFAULT_CHAT_VIEW_OPTIONS, me, ...(value || {}) };
  if (!CHAT_STYLE_IDS.includes(options.style)) {
    options.style = DEFAULT_CHAT_VIEW_OPTIONS.style;
  }
  if (!(options.textSize in TEXT_SIZES)) {
    options.textSize = DEFAULT_CHAT_VIEW_OPTIONS.textSize;
  }
  return options as ChatViewOptions;
}
