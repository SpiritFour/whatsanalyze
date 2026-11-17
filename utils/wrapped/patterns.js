/**
 * What a WhatsApp export writes instead of a message, and the few phrases the
 * story counts, in the six languages the site speaks. Exports are written in
 * the language of the phone that made them, so every pattern lists them all.
 */

/** Left-to-right marks iOS puts around generated text. */
export const cleanText = (text) =>
  String(text ?? "")
    .replace(/[‎‏]/g, "")
    .trim();

export const LAUGH =
  /\b(a?(?:ha){2,}h?|(?:he){2,}|(?:hi){2,}|(?:ja){2,}|k{3,}|(?:rs){2,}|lo+l|lmao|rofl|xd+)\b|[😂🤣💀]/iu;
/** Laughter and emoji, taken out to see whether anything else was said. */
const LAUGH_ALL =
  /\b(a?(?:ha){2,}h?|(?:he){2,}|(?:hi){2,}|(?:ja){2,}|k{3,}|(?:rs){2,}|lo+l|lmao|rofl|xd+)\b|\p{Extended_Pictographic}/giu;

// Android writes "<Media omitted>"; iOS writes the kind and the word alone
// ("image omitted", "Bild weggelassen"), so that form has to be the whole
// message or "I omitted it" would count as a photo. With media, iOS writes
// "<attached: …>" and Android "… (file attached)".
export const MEDIA_PLACEHOLDER =
  /<attached: [^>]+>|<[^>]*(omitted|weggelassen|ausgeschlossen|omesso|omessi|omitido|omitida|omis|omise|oculto|oculta|ocultado|ocultada)[^>]*>|^\S+(?: \S+)? (omitted|weggelassen|omitido|omitida|omis|omise|omesso|omessa|ocultado|ocultada)$|\((file attached|datei angehängt|archivo adjunto|fichier joint|file allegato|arquivo anexado|ficheiro anexado)\)/i;

export const isMedia = (message) =>
  Boolean(message.attachment) ||
  MEDIA_PLACEHOLDER.test(cleanText(message.message));

/** A message its sender deleted: the export keeps a line saying so. */
export const DELETED =
  /^(this message was deleted|you deleted this message|diese nachricht wurde gelöscht|du hast diese nachricht gelöscht|se eliminó este mensaje|eliminaste este mensaje|este mensaje fue eliminado|ce message a été supprimé|vous avez supprimé ce message|tu as supprimé ce message|questo messaggio è stato eliminato|hai eliminato questo messaggio|esta mensagem foi apagada|você apagou esta mensagem|apagou esta mensagem|mensagem apagada)\.?$/i;

/** The note an edited message carries at its end. */
export const EDITED_MARK =
  /\s*<[^<>]*(edited|bearbeitet|editó|editado|editada|modifié|modificato|modificado)[^<>]*>\s*$/i;

export const isDeleted = (text) => DELETED.test(cleanText(text));

/** The text as written, without the export's note that it was edited. */
export const withoutEditMark = (text) =>
  cleanText(text).replace(EDITED_MARK, "").trim();

export const wasEdited = (text) => EDITED_MARK.test(cleanText(text));

// The attachment's kind, from the placeholder ("audio omitted") or the file
// name ("PTT-20260101-WA0001.opus"). Order matters: a sticker is a .webp
// image and a GIF a video, so the narrower kinds are asked first. Android's
// "<Media omitted>" says nothing about the kind.
const MEDIA_KINDS = [
  ["voice", /audio|áudio|\bptt\b|voice|sprach|\.(opus|m4a|aac|mp3|ogg)\b/i],
  ["sticker", /sticker|autocollant|figurinha|pegatina|adesivo|\bstk-/i],
  ["gif", /\bgif\b/i],
  ["video", /video|vídeo|vidéo|\.(mp4|mov|3gp|avi)\b/i],
  [
    "photo",
    /image|imagen|imagem|immagine|bild|photo|foto|\.(jpe?g|png|heic|webp)\b/i,
  ],
  [
    "document",
    /document|dokument|documento|\.(pdf|docx?|xlsx?|pptx?|txt|zip)\b/i,
  ],
  ["contact", /\.vcf\b|contact card|kontaktkarte|tarjeta de contacto/i],
];

export function mediaKind(message) {
  const text = `${message.attachment?.fileName ?? ""} ${cleanText(message.message)}`;
  for (const [kind, pattern] of MEDIA_KINDS) {
    if (pattern.test(text)) return kind;
  }
  return "other";
}

export const LINK = /\bhttps?:\/\/\S+|\bwww\.\S+/i;
const LINK_ALL = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;

const LAUGH_TOKENS =
  /\b(a?(?:ha){2,}h?|(?:he){2,}|(?:hi){2,}|(?:ja){2,}|k{3,}|(?:rs){2,}|lo+l|lmao|rofl|xd+)\b|[😂🤣💀]/giu;

/**
 * How hard a message laughs: "haha" 1, "hahahaha" 2, "😂😂😂" 3. Long laughs
 * and stacked emoji are how people say something was really funny.
 */
export function laughStrength(text) {
  let strength = 0;
  for (const [token] of cleanText(text).matchAll(LAUGH_TOKENS)) {
    strength += /\p{L}/u.test(token) ? Math.max(1, token.length / 4) : 1;
  }
  return Math.min(strength, 6);
}

/**
 * Whether anything is said besides laughing and links: "hahaha 😂" is a
 * reaction, a bare link is a thing shared, neither is the joke.
 */
export function saysSomething(text, minLetters = 4) {
  const rest = cleanText(text).replace(LINK_ALL, "").replace(LAUGH_ALL, "");
  return (rest.match(/\p{L}/gu) || []).length >= minLetters;
}

/** Whole words or phrases only: "sorry" counts, "sorrynotsorry" does not. */
const phrase = (alternatives) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${alternatives
      .map((alternative) => alternative.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})(?![\\p{L}\\p{N}])`,
    "iu",
  );

/**
 * The things people say to each other, counted per person for "Said it with
 * feeling". Good morning only counts at the start of a message, where it is
 * a greeting and not "this morning".
 */
export const PHRASES = {
  love: phrase([
    "love you",
    "love u",
    "love ya",
    "luv you",
    "luv u",
    "ily",
    "liebe dich",
    "hab dich lieb",
    "hab dich so lieb",
    "hdl",
    "hdgdl",
    "te quiero",
    "te amo",
    "tqm",
    "te adoro",
    "je t'aime",
    "je t’aime",
    "jtm",
    "ti amo",
    "ti voglio bene",
    "tvb",
    "amo-te",
    "amo você",
    "amo vc",
  ]),
  miss: phrase([
    "miss you",
    "miss u",
    "miss ya",
    "missing you",
    "vermisse dich",
    "vermiss dich",
    "te extraño",
    "te echo de menos",
    "tu me manques",
    "mi manchi",
    "saudades",
    "saudade",
    "sinto sua falta",
    "sinto a tua falta",
  ]),
  sorry: phrase([
    "sorry",
    "sry",
    "soz",
    "my bad",
    "i apologize",
    "i apologise",
    "entschuldigung",
    "entschuldige",
    "tut mir leid",
    "sorri",
    "perdón",
    "perdon",
    "perdona",
    "perdóname",
    "lo siento",
    "désolé",
    "désolée",
    "desole",
    "pardon",
    "scusa",
    "scusami",
    "mi dispiace",
    "desculpa",
    "desculpe",
    "foi mal",
  ]),
  night: phrase([
    "good night",
    "goodnight",
    "gn",
    "night night",
    "nighty night",
    "nite",
    "sleep well",
    "sleep tight",
    "gute nacht",
    "gn8",
    "schlaf gut",
    "buenas noches",
    "que descanses",
    "bonne nuit",
    "buonanotte",
    "buona notte",
    "boa noite",
    "durma bem",
    "dorme bem",
  ]),
  morning:
    /^[^\p{L}]*(?:good morning|morning|mornin|gm|guten morgen|moin|buenos d[ií]as|buen d[ií]a|bonjour|buongiorno|buon giorno|bom dia)(?![\p{L}\p{N}])/iu,
};

export const PHRASE_KINDS = Object.keys(PHRASES);
