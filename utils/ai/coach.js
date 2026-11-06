/**
 * Safety for the AI coach (components/ai/AiCoach.vue). Coaching someone
 * through abuse or a crisis is not something a chat analyzer should do, so
 * two checks hand over to static support resources instead.
 */

/**
 * Self-harm in what the reader types, caught before any model sees it.
 * shortcut: a keyword list in the site's six languages misses paraphrases;
 * the model's own COACH_SAFETY answer is the backstop for those.
 */
const SELF_HARM =
  /suicid|kill myself|end my life|self[- ]?harm|hurt(ing)? myself|want to die|selbstmord|suizid|mich umbringen|nicht mehr leben|matarme|quitarme la vida|hacerme da[ñn]o|quiero morir|me tuer|en finir avec la vie|me faire du mal|envie de mourir|me matar|tirar minha vida|me machucar|quero morrer|uccidermi|togliermi la vita|farmi del male|voglio morire/i;

export const needsSupport = (text) => SELF_HARM.test(text);

/** The model's handover; the same marker as COACH_SAFETY in insights.ts. */
export const isSafetyReply = (reply) => /\[SAFETY\]/i.test(reply);

/** Where reply help's explanation starts, in the languages the coach writes. */
const WHY =
  /(?:^|\n)\s*[*_]*\s*(why|warum|wieso|por qu[eé]|porqu[eê]|por que|pourquoi|perch[eé])\s*[*_]*\s*:/i;
const words = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/**
 * Did reply help hand the draft back as it was? A small on-device model
 * sometimes repeats it word for word, then explains a change it never made.
 * Nothing before the explanation counts as unchanged too.
 */
export const isUnchangedRewrite = (reply, draft) => {
  const rewrite = words(String(reply ?? "").split(WHY)[0]);
  return !rewrite || rewrite === words(draft);
};
