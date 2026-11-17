/**
 * The image people post: a 1080×1920 card, the size of a WhatsApp status or
 * an Instagram story, drawn on a canvas.
 *
 * Drawn by hand rather than photographed off the slide (html2canvas): the
 * slides are sized for a 340px card, lean on blur and gradient text that a
 * DOM snapshot renders differently in every browser, and would come out at a
 * third of this resolution. Every string arrives translated; nothing here
 * knows a language.
 */

export type CardTheme = "ink" | "sunset" | "violet" | "mint";

export interface CardRow {
  emoji?: string;
  title: string;
  /** The big figure on the right, e.g. an age. */
  value?: string;
  note?: string;
}

export interface CardTile {
  label: string;
  value: string;
}

export interface CardSpec {
  theme: CardTheme;
  eyebrow: string;
  title: string;
  hero?: { value: string; label: string };
  tiles?: CardTile[];
  rows?: CardRow[];
  /** "Make yours free at" */
  footer: string;
  /** "whatsanalyze.com/wrapped" */
  url: string;
}

const WIDTH = 1080;
const HEIGHT = 1920;
const MARGIN = 80;
/**
 * What a WhatsApp status or an Instagram story covers with its own bars:
 * progress and name along the top, the reply field along the bottom. The
 * call to action has to sit above that or nobody sees where to make one.
 */
const SAFE_TOP = 230;
const SAFE_BOTTOM = HEIGHT - 230;
const INNER = WIDTH - MARGIN * 2;
const FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const THEMES: Record<
  CardTheme,
  {
    stops: string[];
    fg: string;
    muted: string;
    accent: string;
    card: string;
    blobs: [string, string];
  }
> = {
  ink: {
    stops: ["#0b1410", "#0c2219", "#0b1410"],
    fg: "#ffffff",
    muted: "rgba(255,255,255,0.72)",
    accent: "#d6ff3f",
    card: "rgba(255,255,255,0.10)",
    blobs: ["rgba(37,211,102,0.55)", "rgba(14,122,95,0.6)"],
  },
  sunset: {
    stops: ["#ff8a1f", "#ff3d5a", "#d81b78"],
    fg: "#ffffff",
    muted: "rgba(255,255,255,0.82)",
    accent: "#fff16b",
    card: "rgba(255,255,255,0.17)",
    blobs: ["rgba(255,210,63,0.6)", "rgba(255,95,162,0.55)"],
  },
  mint: {
    stops: ["#c6f7e2", "#5eead4", "#10b981"],
    fg: "#052e1c",
    muted: "rgba(5,46,28,0.74)",
    accent: "#052e1c",
    card: "rgba(5,46,28,0.10)",
    blobs: ["rgba(255,255,255,0.6)", "rgba(16,185,129,0.45)"],
  },
  violet: {
    stops: ["#4316e0", "#8a2df5", "#e440c4"],
    fg: "#ffffff",
    muted: "rgba(255,255,255,0.8)",
    accent: "#d6ff3f",
    card: "rgba(255,255,255,0.15)",
    blobs: ["rgba(255,95,210,0.55)", "rgba(59,130,255,0.55)"],
  },
};

type Ctx = CanvasRenderingContext2D;

const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

/** The largest size from `max` down to `min` at which `text` fits. */
function fit(
  ctx: Ctx,
  text: string,
  weight: number,
  max: number,
  min: number,
  width: number,
): number {
  let size = max;
  while (size > min) {
    ctx.font = font(weight, size);
    if (ctx.measureText(text).width <= width) break;
    size -= 4;
  }
  ctx.font = font(weight, size);
  return size;
}

function wrap(ctx: Ctx, text: string, width: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (ctx.measureText(attempt).width <= width || !line) {
      line = attempt;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (line && lines.length === maxLines) {
    // Out of room: end the last line with an ellipsis.
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > width) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function blob(ctx: Ctx, x: number, y: number, radius: number, color: string) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function spaced(ctx: Ctx, spacing: string) {
  // Not everywhere yet (Safari before 17); the eyebrow reads fine without.
  if ("letterSpacing" in ctx) {
    (ctx as Ctx & { letterSpacing: string }).letterSpacing = spacing;
  }
}

export function drawCard(canvas: HTMLCanvasElement, spec: CardSpec) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas_context");
  const theme = THEMES[spec.theme];
  const center = WIDTH / 2;

  const background = ctx.createLinearGradient(0, 0, WIDTH * 0.6, HEIGHT);
  theme.stops.forEach((stop, index) =>
    background.addColorStop(index / (theme.stops.length - 1), stop),
  );
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  blob(ctx, WIDTH * 0.95, HEIGHT * 0.08, 620, theme.blobs[0]);
  blob(ctx, WIDTH * 0.02, HEIGHT * 0.95, 700, theme.blobs[1]);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Eyebrow
  ctx.fillStyle = theme.accent;
  ctx.font = font(800, 36);
  spaced(ctx, "7px");
  ctx.fillText(spec.eyebrow.toUpperCase(), center, SAFE_TOP);
  spaced(ctx, "0px");

  // Title, two lines at most
  ctx.fillStyle = theme.fg;
  const titleSize = fit(ctx, spec.title, 900, 96, 64, INNER);
  const titleLines = wrap(ctx, spec.title, INNER, 2);
  let y = SAFE_TOP + 100;
  for (const line of titleLines) {
    ctx.fillText(line, center, y);
    y += titleSize * 1.08;
  }
  y += 30;

  const footerTop = SAFE_BOTTOM - 150;

  if (spec.hero) {
    const size = fit(ctx, spec.hero.value, 900, 280, 140, INNER);
    y += size * 0.86;
    ctx.fillStyle = theme.accent;
    ctx.fillText(spec.hero.value, center, y);
    y += 80;
    ctx.fillStyle = theme.fg;
    ctx.font = font(700, 54);
    ctx.fillText(spec.hero.label, center, y);
    y += 80;
  }

  if (spec.tiles?.length) {
    const gap = 36;
    const tileWidth = (INNER - gap) / 2;
    const rowCount = Math.ceil(spec.tiles.length / 2);
    const tileHeight = Math.min(
      230,
      (footerTop - y - gap * (rowCount - 1)) / rowCount,
    );
    spec.tiles.forEach((tile, index) => {
      const x = MARGIN + (index % 2) * (tileWidth + gap);
      const top = y + Math.floor(index / 2) * (tileHeight + gap);
      ctx.fillStyle = theme.card;
      roundRect(ctx, x, top, tileWidth, tileHeight, 40);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = theme.muted;
      ctx.font = font(700, 30);
      spaced(ctx, "2px");
      ctx.fillText(
        wrap(ctx, tile.label.toUpperCase(), tileWidth - 72, 1)[0] ?? "",
        x + 36,
        top + 66,
      );
      spaced(ctx, "0px");
      ctx.fillStyle = theme.fg;
      fit(ctx, tile.value, 900, 76, 40, tileWidth - 72);
      ctx.fillText(
        wrap(ctx, tile.value, tileWidth - 72, 1)[0] ?? "",
        x + 36,
        top + tileHeight - 50,
      );
    });
    ctx.textAlign = "center";
  }

  if (spec.rows?.length) {
    const gap = 32;
    const rowHeight = Math.min(
      340,
      (footerTop - y - gap * (spec.rows.length - 1)) / spec.rows.length,
    );
    const compact = rowHeight < 240;
    // Two people leave room to spare: centred, not stacked at the top.
    const used = spec.rows.length * rowHeight + gap * (spec.rows.length - 1);
    const offset = Math.max(0, (footerTop - y - used) / 2);
    spec.rows.forEach((row, index) => {
      const top = y + offset + index * (rowHeight + gap);
      ctx.fillStyle = theme.card;
      roundRect(ctx, MARGIN, top, INNER, rowHeight, 44);
      ctx.fill();

      let left = MARGIN + 44;
      let right = MARGIN + INNER - 44;
      const middle = top + rowHeight / 2;

      if (row.emoji) {
        const emojiSize = compact ? 84 : 110;
        ctx.textAlign = "left";
        ctx.font = font(400, emojiSize);
        ctx.fillStyle = theme.fg;
        ctx.fillText(row.emoji, left, middle + emojiSize * 0.36);
        left += emojiSize + 36;
      }

      if (row.value) {
        ctx.textAlign = "right";
        ctx.fillStyle = theme.accent;
        const valueSize = compact ? 120 : 170;
        ctx.font = font(900, valueSize);
        ctx.fillText(row.value, right, middle + valueSize * 0.35);
        right -= ctx.measureText(row.value).width + 36;
      }

      const textWidth = right - left;
      ctx.textAlign = "left";
      ctx.fillStyle = theme.fg;
      const titleMax = compact ? 50 : 62;
      const rowTitleSize = fit(ctx, row.title, 900, titleMax, 36, textWidth);
      const noteSize = compact ? 30 : 34;
      ctx.font = font(500, noteSize);
      const noteLines = row.note
        ? wrap(ctx, row.note, textWidth, compact ? 2 : 3)
        : [];
      const blockHeight =
        rowTitleSize +
        noteLines.length * noteSize * 1.3 +
        (noteLines.length ? 14 : 0);
      let textY = middle - blockHeight / 2 + rowTitleSize * 0.85;
      ctx.font = font(900, rowTitleSize);
      ctx.fillText(wrap(ctx, row.title, textWidth, 1)[0] ?? "", left, textY);
      textY += 14;
      ctx.fillStyle = theme.muted;
      ctx.font = font(500, noteSize);
      for (const line of noteLines) {
        textY += noteSize * 1.3;
        ctx.fillText(line, left, textY);
      }
    });
    ctx.textAlign = "center";
  }

  // Footer: where the next person makes theirs.
  ctx.fillStyle = theme.muted;
  ctx.font = font(600, 36);
  ctx.fillText(spec.footer, center, SAFE_BOTTOM - 66);
  ctx.fillStyle = theme.fg;
  ctx.font = font(900, 50);
  ctx.fillText(spec.url, center, SAFE_BOTTOM);
}

/**
 * A JPEG: a tenth of the PNG's two megabytes, which is what a share sheet
 * has to hand over and WhatsApp has to send. It recompresses every picture
 * to JPEG anyway.
 */
export const CARD_TYPE = "image/jpeg";
export const CARD_EXTENSION = "jpg";

export async function renderCard(spec: CardSpec): Promise<Blob> {
  const canvas = document.createElement("canvas");
  drawCard(canvas, spec);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("no_blob"))),
      CARD_TYPE,
      0.92,
    );
  });
}

export type ShareOutcome = "shared" | "saved" | "cancelled";

function saveBlob(image: Blob, fileName: string) {
  const url = URL.createObjectURL(image);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** iPhone and iPad, the iPad that calls itself a Mac included. */
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Hands the image to the phone's share sheet (WhatsApp status, Instagram
 * story, a chat), or saves it where there is none. Called with the image
 * already rendered: Safari only opens the sheet straight from the tap.
 *
 * On iOS the image goes alone. Given a picture and a text, WhatsApp there
 * (and Messages) takes one of the two, often the text, and the card never
 * arrives. The card names the site itself. Android sends the text along as
 * the picture's caption.
 */
export async function shareImage(
  image: Blob,
  fileName: string,
  text: string,
): Promise<ShareOutcome> {
  const file = new File([image], fileName, { type: image.type || CARD_TYPE });
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share(
        isIOS() ? { files: [file] } : { files: [file], text },
      );
      return "shared";
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return "cancelled";
      // Refused for another reason (an in-app browser, a policy): save it.
    }
  }
  saveBlob(image, fileName);
  return "saved";
}

export function saveImage(image: Blob, fileName: string) {
  saveBlob(image, fileName);
}
