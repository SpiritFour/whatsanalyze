import { AI_QUESTIONS } from "~/utils/ai/questions";

/**
 * Sending an AI reading to the other person in the chat, through WhatsApp
 * (components/ai/AiSendReading.vue), and what they see when they open it
 * (pages/s.vue).
 *
 * A one-sided reading -- whether they're into me, what I should worry about,
 * a question of the reader's own, or one the AI wrote to the reader as "you"
 * -- can escalate a conflict once it lands in the other person's chat. So
 * only readings about the two of them are offered: "How could we communicate
 * better?" and no question at all.
 */

/**
 * The question as analytics may carry it: the preset's id or "none". Never
 * a question of the reader's own, which isn't sendable anyway.
 */
export const sentQuestion = (report) => report?.asked?.preset ?? "none";

/**
 * Can this reading go to the other person? Only one about the two of them,
 * that the AI didn't write to the reader as "you". A reading from before
 * the page kept what was asked says nothing either way, so it can't.
 */
export function canSendReading(report) {
  const asked = report?.asked;
  if (!asked || asked.toReader !== false) return false;
  if (asked.preset === null) return true;
  return !!AI_QUESTIONS.find((q) => q.id === asked.preset)?.sendable;
}

/**
 * Who it goes from and to: a chat between exactly two people, one of them
 * the reader. Null while it isn't known which one the reader is, or if the
 * chat isn't between two.
 */
export function sendParties(people, me) {
  if (!Array.isArray(people) || people.length !== 2) return null;
  if (!people.includes(me)) return null;
  return { from: me, to: people.find((p) => p !== me) };
}

/**
 * What the link carries: the reading exactly as the reader saw it, and who
 * sent it. A free preview's locked cards stay behind -- blurred cards about
 * the two of them, behind a paywall, are no way to receive a reading.
 */
export function readingToSend(report, from) {
  return { ...report, locked: null, sentBy: { from } };
}

/**
 * A reading someone sent, as /s opens it: only a sendable one is shown as
 * sent, whatever the link says. Anything else opens as an ordinary shared
 * report.
 */
export const sentReadingFrom = (report) =>
  canSendReading(report) &&
  typeof report?.sentBy?.from === "string" &&
  report.sentBy.from.trim()
    ? report.sentBy.from.trim()
    : null;

/**
 * WhatsApp's own link for "send this text": with no number in it, WhatsApp
 * asks who to send it to, so it never goes anywhere without the reader
 * choosing the chat.
 */
export const whatsAppLink = (text) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;

/**
 * Opening a sent reading, remembered for a while: the other person usually
 * has to export their chat before they can get their own reading, and that
 * can take a day. Only the question's id and when, nothing of the reading.
 */
const OPENED_KEY = "ai-share-opened";
const OPENED_FOR_MS = 30 * 24 * 60 * 60 * 1000;

export function rememberSentOpened(question, now = Date.now()) {
  try {
    localStorage.setItem(OPENED_KEY, JSON.stringify({ question, at: now }));
  } catch {
    // Storage blocked: their reading just won't count as converted.
  }
}

/**
 * Their own reading is done: was a sent one opened in this browser lately?
 * Returns its question once, then forgets it, so it counts one conversion.
 */
export function takeSentOpened(now = Date.now()) {
  try {
    const opened = JSON.parse(localStorage.getItem(OPENED_KEY) ?? "null");
    localStorage.removeItem(OPENED_KEY);
    if (!opened || typeof opened.at !== "number") return null;
    if (now - opened.at > OPENED_FOR_MS || now < opened.at) return null;
    return typeof opened.question === "string" ? opened.question : "none";
  } catch {
    return null;
  }
}
