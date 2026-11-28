import loraRegular from "@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf?url";
import loraBold from "@expo-google-fonts/lora/700Bold/Lora_700Bold.ttf?url";
import nunitoRegular from "@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf?url";
import nunitoBold from "@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf?url";
import courierRegular from "@expo-google-fonts/courier-prime/400Regular/CourierPrime_400Regular.ttf?url";
import courierBold from "@expo-google-fonts/courier-prime/700Bold/CourierPrime_700Bold.ttf?url";
import { PDF_FONT_FAMILY } from "~/utils/pdf/fonts";
import { FONT_COVERAGE } from "~/utils/pdf/chatFontCoverage";
import type { PdfFont } from "~/utils/pdf/fonts";

/**
 * The font choices of the WhatsApp-to-PDF tool (Pro). All three are SIL Open
 * Font License fonts, shipped as TTF because jsPDF embeds TrueType only.
 *
 * Each is fetched only when picked (~270 KB for both weights) and then used
 * twice from the same bytes: as an @font-face for layout and preview, and
 * embedded in the PDF. They cover fewer scripts than a phone does, so the
 * tool only offers a font that has every letter of the chat: see `fontsFor`
 * and utils/pdf/chatFontCoverage.ts.
 */

export type ChatFontId = "default" | "serif" | "rounded" | "typewriter";
export const CHAT_FONT_IDS: ChatFontId[] = [
  "default",
  "serif",
  "rounded",
  "typewriter",
];

interface FontFiles {
  family: string;
  normal: string;
  bold: string;
}

const FILES: Record<Exclude<ChatFontId, "default">, FontFiles> = {
  // Lora: a book serif, for keepsakes.
  serif: { family: "WaSerif", normal: loraRegular, bold: loraBold },
  // Nunito: rounded and friendly.
  rounded: { family: "WaRounded", normal: nunitoRegular, bold: nunitoBold },
  // Courier Prime: a typewriter, like a transcript of letters.
  typewriter: {
    family: "WaTypewriter",
    normal: courierRegular,
    bold: courierBold,
  },
};

/** The CSS family list for a choice; the default font is always the fallback. */
export function chatFontFamily(id: ChatFontId | undefined): string {
  const files = id && id !== "default" ? FILES[id] : null;
  return files
    ? `"${files.family}", "${PDF_FONT_FAMILY}", Helvetica, Arial, sans-serif`
    : `"${PDF_FONT_FAMILY}", Helvetica, Arial, sans-serif`;
}

/**
 * @font-face rules pointing at the font files, for the on-screen preview and
 * the browser printout. Same files as the PDF embeds, so same metrics.
 */
export function chatFontFaceCss(id: ChatFontId | undefined): string {
  const files = id && id !== "default" ? FILES[id] : null;
  if (!files) return "";
  return ([400, 700] as const)
    .map(
      (weight) => `
@font-face {
  font-family: "${files.family}";
  font-weight: ${weight};
  src: url("${weight === 400 ? files.normal : files.bold}") format("truetype");
}`,
    )
    .join("");
}

const loaded = new Map<string, Promise<PdfFont>>();

async function base64Of(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  // In chunks: String.fromCharCode with a whole font's bytes overflows the
  // argument limit.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** The chosen font, ready to embed; null for the default font. */
export function loadChatFont(
  id: ChatFontId | undefined,
): Promise<PdfFont> | null {
  const files = id && id !== "default" ? FILES[id] : null;
  if (!files) return null;
  let font = loaded.get(files.family);
  if (!font) {
    font = Promise.all([base64Of(files.normal), base64Of(files.bold)]).then(
      ([normal, bold]) => ({ family: files.family, normal, bold }),
    );
    // A failed download may be retried with the next export.
    font.catch(() => loaded.delete(files.family));
    loaded.set(files.family, font);
  }
  return font;
}

/**
 * Every font choice's @font-face, for the page. Browsers only download a face
 * once something on the page uses it: the chosen font, and the font chips.
 */
export function allChatFontFaceCss(): string {
  return CHAT_FONT_IDS.map((id) => chatFontFaceCss(id)).join("");
}

/**
 * What a font never has to draw: emoji (they are artwork, see emoji.ts) and
 * the joiners, selectors and modifiers they are built from, invisible format
 * marks such as WhatsApp's left-to-right marks, and white space.
 */
const NOT_DRAWN = /[\p{Extended_Pictographic}\p{Cf}\p{Z}\s]/u;

/** Emoji parts that are not Extended_Pictographic themselves. */
function isEmojiPart(point: number): boolean {
  return (
    point === 0xfe0e || // text and emoji presentation selectors
    point === 0xfe0f ||
    point === 0x20e3 || // keycap
    (point >= 0x1f3fb && point <= 0x1f3ff) || // skin tones
    (point >= 0x1f1e6 && point <= 0x1f1ff) || // flag letters
    (point >= 0xe0020 && point <= 0xe007f) // tag sequences (subdivision flags)
  );
}

/** The distinct characters a set of texts asks a font to draw. */
export function charactersOf(texts: Iterable<string | null | undefined>) {
  const characters = new Set<number>();
  for (const text of texts) {
    if (!text) continue;
    for (const character of text) {
      const point = character.codePointAt(0) as number;
      if (!NOT_DRAWN.test(character) && !isEmojiPart(point)) {
        characters.add(point);
      }
    }
  }
  return characters;
}

function covers(ranges: Array<[number, number]>, point: number): boolean {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const [first, last] = ranges[middle];
    if (point < first) high = middle - 1;
    else if (point > last) low = middle + 1;
    else return true;
  }
  return false;
}

/**
 * The font choices that can draw every one of these characters. The default
 * font is always offered: it is what the layout falls back to anyway. A chat
 * in Arabic, Hebrew, Greek or Chinese gets the default font only, and one in
 * Russian loses the typewriter, which has no Cyrillic.
 */
export function fontsFor(characters: Set<number>): ChatFontId[] {
  return CHAT_FONT_IDS.filter((id) => {
    if (id === "default") return true;
    const ranges = FONT_COVERAGE[id];
    if (!ranges) return false;
    for (const point of characters) {
      if (!covers(ranges, point)) return false;
    }
    return true;
  });
}
