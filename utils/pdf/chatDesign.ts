import {
  CHAT_STYLES,
  DEFAULT_CHAT_VIEW_OPTIONS,
  isProStyle,
} from "~/utils/pdf/chatStyles";
import type {
  ChatStyle,
  ChatViewOptions,
  CustomColors,
  PresetStyleId,
} from "~/utils/pdf/chatStyles";

/**
 * The Pro design layer of the WhatsApp-to-PDF tool: custom colours, a
 * wallpaper behind the chat and a personalised cover.
 *
 * Everyone can try it in the on-screen preview; the PDF (download and Print)
 * only carries it with full access, see `designForAccess`. Colours chosen by
 * hand never decide text colour on their own: every text colour is picked for
 * contrast against what it sits on, so no combination comes out unreadable.
 */

// ----- colour arithmetic ---------------------------------------------------

type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb | null {
  const match = String(hex)
    .trim()
    .match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const digits =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((d) => d + d)
          .join("")
      : match[1];
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** `amount` of the way from `a` to `b`. */
export function mix(a: string, b: string, amount: number): string {
  const from = hexToRgb(a) ?? [0, 0, 0];
  const to = hexToRgb(b) ?? [0, 0, 0];
  return rgbToHex(from.map((v, i) => v + (to[i] - v) * amount) as Rgb);
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const INK = "#111b21";
const PAPER = "#f4f6f7";

/**
 * Dark or light text, whichever reads better on `background`: the soft ink
 * and paper tones when they pass 4.5:1, pure black or white when a mid-tone
 * background leaves them short.
 */
export function textOn(background: string): string {
  const soft =
    contrast(INK, background) >= contrast(PAPER, background) ? INK : PAPER;
  if (contrast(soft, background) >= 4.5) return soft;
  return contrast("#000000", background) >= contrast("#ffffff", background)
    ? "#000000"
    : "#ffffff";
}

/** Secondary text: the readable colour pulled towards the background. */
export function mutedOn(background: string): string {
  const text = textOn(background);
  // As far towards the background as still passes 4.5:1.
  for (const amount of [0.45, 0.35, 0.25, 0.15]) {
    const muted = mix(text, background, amount);
    if (contrast(muted, background) >= 4.5) return muted;
  }
  return text;
}

/** Whether a colour is dark enough that the design counts as a dark theme. */
export const isDark = (hex: string) => luminance(hex) < 0.2;

// ----- custom palette ------------------------------------------------------

export const DEFAULT_CUSTOM_COLORS: CustomColors =
  DEFAULT_CHAT_VIEW_OPTIONS.colors;

/** A full chat style from four chosen colours. */
export function deriveStyle(colors: CustomColors): ChatStyle {
  const page = hexToRgb(colors.page) ? colors.page : DEFAULT_CUSTOM_COLORS.page;
  const bubbleIn = hexToRgb(colors.bubbleIn)
    ? colors.bubbleIn
    : DEFAULT_CUSTOM_COLORS.bubbleIn;
  const bubbleOut = hexToRgb(colors.bubbleOut)
    ? colors.bubbleOut
    : DEFAULT_CUSTOM_COLORS.bubbleOut;
  const accent = hexToRgb(colors.accent)
    ? colors.accent
    : DEFAULT_CUSTOM_COLORS.accent;
  const dark = isDark(page);
  // Chips and bars sit a step off the page, towards the text.
  const chip = mix(page, textOn(page), dark ? 0.14 : 0.08);

  return {
    id: "custom",
    page,
    header: chip,
    headerText: textOn(chip),
    headerMuted: mutedOn(chip),
    bubbleIn,
    bubbleOut,
    // Bubble text has to read on both bubbles: the one that reads better on
    // the worse of the two. Per-bubble text is set in the CSS as well.
    text: textOn(bubbleIn),
    textOut: textOn(bubbleOut),
    muted: mutedOn(bubbleIn),
    mutedOut: mutedOn(bubbleOut),
    dayBackground: chip,
    dayText: mutedOn(chip),
    systemBackground: chip,
    systemText: mutedOn(chip),
    folio: mutedOn(page),
    radius: 16,
    dayRadius: 12,
    colorNames: true,
    // Names sit on incoming bubbles; the accent, unless it is unreadable there.
    name: contrast(accent, bubbleIn) >= 3 ? accent : textOn(bubbleIn),
    accent,
  };
}

/** The palette the options ask for, preset or custom. */
export function resolveStyle(options: ChatViewOptions): ChatStyle {
  if (options.style === "custom") {
    return deriveStyle(options.colors ?? DEFAULT_CUSTOM_COLORS);
  }
  return (
    CHAT_STYLES[options.style as PresetStyleId] ?? CHAT_STYLES["iphone-light"]
  );
}

// ----- what counts as Pro ---------------------------------------------------

export function hasCustomCover(options: ChatViewOptions): boolean {
  const cover = options.cover;
  return !!(
    cover?.title?.trim() ||
    cover?.dedication?.trim() ||
    cover?.color ||
    cover?.photo
  );
}

export function isPremiumDesign(options: ChatViewOptions): boolean {
  return (
    options.style === "custom" ||
    isProStyle(options.style) ||
    (options.font ?? "default") !== "default" ||
    !!options.book ||
    (options.avatars?.length ?? 0) > 0 ||
    (options.wallpaper?.kind ?? "none") !== "none" ||
    hasCustomCover(options)
  );
}

/**
 * The design as it may be printed: as chosen with full access, otherwise the
 * free part of it. A custom palette falls back to the preset it started from.
 */
export function designForAccess(
  options: ChatViewOptions,
  fullAccess: boolean,
): ChatViewOptions {
  if (fullAccess || !isPremiumDesign(options)) return options;
  return {
    ...options,
    style:
      options.style === "custom" || isProStyle(options.style)
        ? options.baseStyle
        : options.style,
    font: "default",
    book: false,
    bookCompact: false,
    avatars: [],
    wallpaper: { kind: "none", pattern: "dots", dim: 0 },
    cover: { title: "", dedication: "", color: null, photo: false },
  };
}

// ----- wallpapers -----------------------------------------------------------

export type PatternId =
  "dots" | "hearts" | "stars" | "grid" | "waves" | "confetti";
export const PATTERN_IDS: PatternId[] = [
  "dots",
  "hearts",
  "stars",
  "grid",
  "waves",
  "confetti",
];

/** A4 at 150 dpi: sharp in print, a few hundred KB as JPEG. */
export const WALLPAPER_SIZE = { width: 1240, height: 1754 };

/** A sheet's size at 150 dpi, so a wallpaper is never stretched. */
export function wallpaperSize(paper?: { widthMm: number; heightMm: number }): {
  width: number;
  height: number;
} {
  if (!paper) return WALLPAPER_SIZE;
  return {
    width: Math.round((paper.widthMm / 25.4) * 150),
    height: Math.round((paper.heightMm / 25.4) * 150),
  };
}

function drawHeart(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
) {
  c.beginPath();
  c.moveTo(x, y + s * 0.3);
  c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  c.bezierCurveTo(
    x,
    y + s * 0.8,
    x + s * 0.5,
    y + s * 0.6,
    x + s * 0.5,
    y + s * 0.3,
  );
  c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  c.fill();
}

function drawStar(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    c[i ? "lineTo" : "moveTo"](
      x + radius * Math.cos(angle),
      y + radius * Math.sin(angle),
    );
  }
  c.closePath();
  c.fill();
}

/** A seeded random sequence, so a pattern looks the same every time. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

/**
 * Draws a wallpaper pattern in the style's own colours, as a JPEG data URL.
 * Generated rather than shipped: no image files to download or license, and
 * it always matches the palette.
 */
export function patternWallpaper(
  pattern: PatternId,
  style: ChatStyle,
  paper?: { widthMm: number; heightMm: number },
): string {
  const size = wallpaperSize(paper);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const c = canvas.getContext("2d");
  if (!c) return "";
  const { width, height } = canvas;
  const ink = mix(
    style.page,
    textOn(style.page),
    isDark(style.page) ? 0.12 : 0.09,
  );
  c.fillStyle = style.page;
  c.fillRect(0, 0, width, height);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  const random = seeded(PATTERN_IDS.indexOf(pattern) + 7);

  if (pattern === "dots") {
    for (let y = 30; y < height; y += 60) {
      for (let x = (y / 60) % 2 ? 60 : 30; x < width; x += 60) {
        c.beginPath();
        c.arc(x, y, 5, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else if (pattern === "grid") {
    c.lineWidth = 2;
    for (let x = 0; x <= width; x += 62) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, height);
      c.stroke();
    }
    for (let y = 0; y <= height; y += 62) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(width, y);
      c.stroke();
    }
  } else if (pattern === "waves") {
    c.lineWidth = 4;
    for (let y = 40; y < height + 40; y += 70) {
      c.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const wave = y + Math.sin((x / width) * Math.PI * 6) * 16;
        c[x ? "lineTo" : "moveTo"](x, wave);
      }
      c.stroke();
    }
  } else if (pattern === "hearts") {
    for (let y = 20; y < height; y += 120) {
      for (let x = (y / 120) % 2 ? 100 : 40; x < width; x += 140) {
        drawHeart(c, x, y, 34 + random() * 12);
      }
    }
  } else if (pattern === "stars") {
    for (let i = 0; i < 260; i++) {
      drawStar(c, random() * width, random() * height, 8 + random() * 16);
    }
  } else if (pattern === "confetti") {
    for (let i = 0; i < 420; i++) {
      c.save();
      c.translate(random() * width, random() * height);
      c.rotate(random() * Math.PI);
      c.fillRect(-10, -3, 20, 6);
      c.restore();
    }
  }

  return canvas.toDataURL("image/jpeg", 0.86);
}

/**
 * A photo as a page wallpaper: cropped to fill an A4 sheet and dimmed
 * towards the page colour by `dim` (0–0.9), so bubbles and text stay readable
 * on it. The PDF cannot draw transparency, so the dimming is baked into the
 * image here, on the device.
 */
export async function photoWallpaper(
  source: Blob,
  pageColor: string,
  dim: number,
  paper?: { widthMm: number; heightMm: number },
): Promise<string> {
  const bitmap = await createImageBitmap(source);
  const size = wallpaperSize(paper);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const c = canvas.getContext("2d");
  if (!c) return "";

  const scale = Math.max(
    canvas.width / bitmap.width,
    canvas.height / bitmap.height,
  );
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  c.drawImage(bitmap, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  bitmap.close?.();

  c.globalAlpha = Math.max(0, Math.min(0.9, dim));
  c.fillStyle = pageColor;
  c.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

/**
 * A photo for the cover, at most `maxSide` px on its longer side. Kept as a
 * JPEG data URL: small enough to keep for the tab, sharp enough in print.
 */
export async function coverPhoto(
  source: Blob,
  maxSide = 1400,
): Promise<string> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.88);
}

/**
 * A profile picture: the middle square of the photo, 256 px, as a JPEG data
 * URL. Small enough to keep for the tab; the PDF clips it round.
 */
export async function avatarPhoto(source: Blob, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(source);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.88);
}
