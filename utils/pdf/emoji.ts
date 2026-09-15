import twemoji from "@twemoji/api";

/**
 * Colour emoji for the PDF export.
 *
 * PDF has no concept of colour font tables, so an emoji left as text renders
 * monochrome (or as tofu) no matter which generator produced the file -- this
 * is true of the browser's own print-to-PDF as well. The only way to get real
 * colour emoji into a PDF is to draw them as artwork, which is what this module
 * prepares: Twemoji SVG for the on-screen layout pass, and a rasterised PNG of
 * the same artwork for the PDF itself (jsPDF can only place raster images).
 *
 * The artwork comes from one bundled sprite rather than per-emoji requests, so
 * exporting a chat cannot reveal which emoji it contains. See
 * scripts/build-twemoji-sprite.mjs.
 */

const SPRITE_URL = "/twemoji-sprite.json";

/** Twemoji artwork is drawn on a 36x36 grid; 72px keeps it sharp in print. */
const RASTER_SIZE = 72;

let spritePromise: Promise<Map<string, string>> | null = null;
const rasterCache = new Map<string, string>();

/** Does this text contain anything twemoji would turn into artwork? */
export function hasEmoji(text: string): boolean {
  return twemoji.test(text);
}

/**
 * Fetches the emoji artwork. One request for the whole set, cached for the
 * lifetime of the page; callers should only trigger it for chats that actually
 * contain emoji.
 */
export function loadEmojiSprite(): Promise<Map<string, string>> {
  if (spritePromise) return spritePromise;

  spritePromise = fetch(SPRITE_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Emoji sprite request failed: ${response.status}`);
      }
      return response.json();
    })
    .then((sprite: Record<string, string>) => new Map(Object.entries(sprite)))
    .catch((error) => {
      // A missing sprite must not fail the export: without artwork the emoji
      // simply stay as text (monochrome, but the transcript is intact).
      console.error("Could not load emoji artwork", error);
      spritePromise = null;
      return new Map<string, string>();
    });

  return spritePromise;
}

function svgDataUrl(svg: string): string {
  // encodeURIComponent rather than base64: smaller, and these data URLs are
  // only ever consumed by <img> in the offscreen layout.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Turns plain message text into layout HTML, replacing every emoji with an
 * `<img>` of its Twemoji artwork.
 *
 * Doing the substitution *before* the browser lays the message out is what
 * makes the export faithful: the emoji occupies a real box that the line
 * breaker accounts for, so the position we later measure is exactly where the
 * artwork belongs in the PDF. twemoji's own matcher handles ZWJ sequences,
 * variation selectors and skin-tone modifiers, so those arrive as one image
 * rather than a pile of components.
 */
export function messageToHtml(
  text: string,
  sprite: Map<string, string>
): string {
  const escaped = escapeHtml(text);
  if (sprite.size === 0) return escaped;

  return twemoji.parse(escaped, {
    className: "wa-emoji",
    callback: (iconId: string) => {
      const svg = sprite.get(iconId);
      return svg ? svgDataUrl(svg) : false;
    },
    // Carry the icon id through to the measuring pass so it can look up the
    // rasterised version without re-deriving it from the data URL.
    attributes: (_rawText: string, iconId: string) => ({
      "data-emoji": iconId,
    }),
  });
}

/**
 * Rasterises one emoji's SVG to a PNG data URL for jsPDF, memoised per icon —
 * a chat that uses 😂 four thousand times rasterises it once.
 */
export async function rasterizeEmoji(
  iconId: string,
  sprite: Map<string, string>
): Promise<string | null> {
  const cached = rasterCache.get(iconId);
  if (cached) return cached;

  const svg = sprite.get(iconId);
  if (!svg) return null;

  try {
    const image = new Image(RASTER_SIZE, RASTER_SIZE);
    image.src = svgDataUrl(svg);
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = RASTER_SIZE;
    canvas.height = RASTER_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, 0, 0, RASTER_SIZE, RASTER_SIZE);

    const png = canvas.toDataURL("image/png");
    rasterCache.set(iconId, png);
    return png;
  } catch (error) {
    console.error(`Could not rasterise emoji ${iconId}`, error);
    return null;
  }
}
