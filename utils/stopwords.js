import stopwordsDe from "stopwords-de";
import stopwordsEn from "stopwords-en";

/**
 * Words that say nothing about a chat, shared by everything that ranks words:
 * the word counter tool and the analyzer's word cloud. The two used to keep
 * their own lists, so "yes" was filtered on /tools/word-counter and ranked
 * third on the results page of the same chat.
 *
 * The English and German lists come from the packages; the other languages
 * have no package here, so their most common words stay listed by hand.
 */
export const COMMON_STOPWORDS = new Set([
  ...stopwordsEn,
  ...stopwordsDe,
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "der",
  "die",
  "das",
  "und",
  "zu",
  "den",
  "nicht",
  "von",
  "sie",
  "ist",
  "des",
  "sich",
  "mit",
  "dem",
  "dass",
  "er",
  "es",
  "ein",
  "ich",
  "auf",
  "so",
  "eine",
  "auch",
  "als",
  "nach",
  "wie",
  "im",
  "für",
  "man",
  "aber",
  "aus",
  "durch",
  "wenn",
  "nur",
  "war",
  "noch",
  "de",
  "la",
  "que",
  "el",
  "en",
  "y",
  "los",
  "se",
  "del",
  "las",
  "un",
  "por",
  "con",
  "no",
  "una",
  "su",
  "para",
  "al",
  "e",
  "o",
  "da",
  "em",
  "um",
  "com",
  "não",
  "uma",
  "os",
  "na",
  "mais",
  "dos",
  "como",
  "mas",
  "le",
  "à",
  "être",
  "et",
  "avoir",
  "pour",
  "dans",
  "ce",
  "il",
  "qui",
  "ne",
  "sur",
  "pas",
  "plus",
  "pouvoir",
  "di",
  "che",
  "per",
  "sono",
  "non",
  "si",
  "dei",
  "ed",
  "<media",
  "omitted>",
  "omitted",
  "pm",
  "am",
  "null",
  "undefined",
]);

/**
 * Punctuation that sits around a word rather than inside it.
 *
 * Angle brackets and underscores are deliberately left alone: WhatsApp writes
 * its own markers as "<Medien ausgeschlossen>" and "_attached", and those are
 * recognised by their brackets — stripping them would turn a marker into the
 * word "medien". The variation selector and the zero-width joiner are left
 * alone for the same kind of reason: "❤️" ends in one, and an emoji stripped
 * of it stops counting as an emoji and drops out of the emoji podium.
 */
const KEPT = "\\p{L}\\p{N}\\p{Extended_Pictographic}\\uFE0F\\u200D<>_";
// The joiner and the variation selector are in the class on purpose: the rule
// below guards against tearing emoji apart, which is the very thing keeping
// them here prevents.
// eslint-disable-next-line no-misleading-character-class
const EDGE_PUNCTUATION = new RegExp(`^[^${KEPT}]+|[^${KEPT}]+$`, "gu");

/**
 * One spelling per word. "Nice", "nice" and "nice!" are the same thing said
 * three times, and the word cloud used to give each of them its own entry —
 * which also meant none of them ever matched the stopword list.
 */
export function normalizeWord(word) {
  return String(word).toLowerCase().replace(EDGE_PUNCTUATION, "");
}

export function isStopword(word) {
  return COMMON_STOPWORDS.has(normalizeWord(word));
}
