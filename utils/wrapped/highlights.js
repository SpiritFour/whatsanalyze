import { isStopword, normalizeWord } from "~/utils/stopwords";
import { getChemistry, getMoments } from "~/utils/wrapped/moments";
import {
  LAUGH,
  isDeleted,
  isMedia,
  withoutEditMark,
} from "~/utils/wrapped/patterns";

/**
 * The numbers behind the 2026 story: totals, the chat's clock, streaks and
 * silences, who replies how fast, and the two things people send on — a
 * "texting age" and a role for everyone.
 *
 * Plain JavaScript on purpose: Jest here runs .js only, and this is the part
 * of Wrapped with rules worth testing. Everything returned is JSON (numbers,
 * strings, arrays), because the result is kept in sessionStorage and, for a
 * share link, encrypted into Firestore and read back by someone else's
 * browser — in another timezone, where a Date would land on another day.
 *
 * Times are the wall clock the export shows: whatsapp-chat-parser builds its
 * dates with the local constructor, so the local getters give back exactly
 * the hour and day that stand in the file.
 */

export const HIGHLIGHTS_VERSION = 2;

/** A gap this long means the next message starts a new conversation. */
const CONVERSATION_GAP_MS = 6 * 60 * 60 * 1000;
/** How many people a story names; the rest are counted, not listed. */
const MAX_PEOPLE = 8;
/** Under this many written messages a person gets no age and no role. */
const MIN_MESSAGES_FOR_PROFILE = 25;
const MIN_REPLIES = 5;

const EMOJI = /\p{Extended_Pictographic}/gu;
const LETTER = /\p{L}/u;
const CASED_START = /^[^\p{L}\p{N}]*(\p{Lu}|\p{Ll})/u;
const STRETCHED = /(\p{L})\1{2,}/u;
const ELLIPSIS = /\.{3,}|…/;
const SAME_EMOJI_RUN = /(\p{Extended_Pictographic})️?(?:\1️?){2,}/u;
// What each generation reaches for. Not science: the joke only works if it
// is roughly right, and these are the emoji that get called out by name.
// One code point each: a joined emoji would be split by the matcher above and
// count its parts.
const YOUNG_EMOJI = new Set([
  "💀",
  "😭",
  "🫠",
  "🥹",
  "✨",
  "🫶",
  "🤡",
  "🙃",
  "😩",
  "🤌",
  "🫡",
  "🥲",
  "🤭",
  "🫣",
  "🧍",
  "🤠",
  "👀",
  "🗿",
  "🫨",
  "🫥",
]);
const OLD_EMOJI = new Set([
  "😂",
  "🤣",
  "👍",
  "😊",
  "😉",
  "🙏",
  "😁",
  "😀",
  "😄",
  "🌹",
  "👌",
  "☺",
  "😘",
  "🙂",
  "💐",
  "😃",
  "😆",
  "🤗",
  "👏",
  "💪",
  "😎",
]);
const YOUNG_SLANG = new Set([
  "ngl",
  "fr",
  "bruh",
  "slay",
  "sus",
  "lowkey",
  "highkey",
  "cringe",
  "rizz",
  "delulu",
  "idk",
  "tbh",
  "istg",
  "ong",
  "bestie",
  "vibe",
  "vibes",
  "mid",
  "based",
  "cooked",
]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
/** Where `value` sits between `low` and `high`, as -1 … 1. */
const spread = (value, low, high) =>
  clamp((value - low) / (high - low), 0, 1) * 2 - 1;
const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const pad = (value) => String(value).padStart(2, "0");
const dayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
/** Midnight of that day as a UTC timestamp, so day arithmetic skips DST. */
const dayNumber = (date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function newPerson(name) {
  return {
    name,
    messages: 0,
    written: 0,
    words: 0,
    media: 0,
    emoji: 0,
    emojiCounts: new Map(),
    youngEmoji: 0,
    oldEmoji: 0,
    night: 0,
    morning: 0,
    questions: 0,
    laughs: 0,
    periodEnds: 0,
    ellipses: 0,
    stretched: 0,
    emojiRuns: 0,
    casedStarts: 0,
    lowercaseStarts: 0,
    slang: 0,
    starts: 0,
    bursts: 0,
    replyMinutes: [],
    wordCounts: new Map(),
  };
}

function readMessage(person, message, hour) {
  person.messages += 1;
  if (hour >= 23 || hour < 5) person.night += 1;
  if (hour >= 5 && hour < 9) person.morning += 1;

  if (isMedia(message)) {
    person.media += 1;
    return;
  }
  // "This message was deleted" is nobody's words.
  if (isDeleted(message.message)) return;

  const text = withoutEditMark(message.message);
  if (!text) return;
  person.written += 1;

  const emojis = text.match(EMOJI) || [];
  person.emoji += emojis.length;
  for (const emoji of emojis) {
    person.emojiCounts.set(emoji, (person.emojiCounts.get(emoji) || 0) + 1);
    if (YOUNG_EMOJI.has(emoji)) person.youngEmoji += 1;
    else if (OLD_EMOJI.has(emoji)) person.oldEmoji += 1;
  }
  if (SAME_EMOJI_RUN.test(text)) person.emojiRuns += 1;

  if (text.includes("?")) person.questions += 1;
  if (LAUGH.test(text)) person.laughs += 1;
  if (ELLIPSIS.test(text)) person.ellipses += 1;
  else if (/[^.]\.$/.test(text)) person.periodEnds += 1;
  if (STRETCHED.test(text)) person.stretched += 1;

  const start = CASED_START.exec(text);
  if (start) {
    person.casedStarts += 1;
    if (start[1] === start[1].toLowerCase()) person.lowercaseStarts += 1;
  }

  let slangHit = false;
  for (const raw of text.split(/\s+/)) {
    if (!LETTER.test(raw)) continue;
    person.words += 1;
    // Links carry no words of anybody's own.
    if (/^(https?:|www\.)/i.test(raw)) continue;
    const word = normalizeWord(raw);
    if (!word) continue;
    if (YOUNG_SLANG.has(word)) slangHit = true;
    if (word.length > 2 && !isStopword(word)) {
      person.wordCounts.set(word, (person.wordCounts.get(word) || 0) + 1);
    }
  }
  if (slangHit) person.slang += 1;
}

/**
 * The age someone texts like, 13 to 79. A weighted vote of habits that differ
 * by generation and not by language: which emoji, how long, how punctuated.
 * It is a party trick and the slide says so.
 */
function textingAge(person) {
  if (person.written < MIN_MESSAGES_FOR_PROFILE) return null;
  const share = (count) => count / person.written;
  const avgWords = person.words / person.written;
  const marked = person.youngEmoji + person.oldEmoji;
  const lowercase = person.casedStarts
    ? person.lowercaseStarts / person.casedStarts
    : 0;

  // What the habit is called when it leans old, when it leans young, its
  // weight, and where this person lands from -1 (young) to 1 (old).
  const votes = [
    [
      "emojiOld",
      "emojiYoung",
      0.3,
      marked >= 5 ? (person.oldEmoji - person.youngEmoji) / marked : 0,
    ],
    ["longMessages", "shortMessages", 0.2, spread(avgWords, 3, 14)],
    [
      "fullStops",
      "noFullStops",
      0.15,
      spread(share(person.periodEnds), 0.02, 0.3),
    ],
    ["capitals", "lowercase", 0.15, -spread(lowercase, 0.2, 0.85)],
    ["ellipsis", null, 0.12, clamp(share(person.ellipses) / 0.08, 0, 1)],
    [null, "stretched", 0.1, -clamp(share(person.stretched) / 0.06, 0, 1)],
    [null, "slang", 0.08, -clamp(share(person.slang) / 0.05, 0, 1)],
    ["emojiRuns", null, 0.08, clamp(share(person.emojiRuns) / 0.05, 0, 1)],
  ];

  const score = votes.reduce(
    (sum, [, , weight, lean]) => sum + weight * lean,
    0,
  );
  const age = Math.round(34 + score * (score < 0 ? 26 : 36));

  // The habits that pushed hardest in the direction the age came out.
  const reasons = votes
    .map(([old, young, weight, lean]) => ({
      id: lean < 0 ? young : old,
      pull: weight * lean,
    }))
    .filter(({ id, pull }) => id && (score < 0 ? pull < -0.03 : pull > 0.03))
    .sort((a, b) => Math.abs(b.pull) - Math.abs(a.pull))
    .slice(0, 2)
    .map(({ id }) => id);

  // The emoji the first reason is about, if it is about one.
  const pool = score < 0 ? YOUNG_EMOJI : OLD_EMOJI;
  const emoji = [...person.emojiCounts.entries()]
    .filter(([symbol]) => pool.has(symbol))
    .sort((a, b) => b[1] - a[1])[0];

  return { age: clamp(age, 13, 79), reasons, emoji: emoji ? emoji[0] : null };
}

/**
 * Every role with how strongly this person fits it (1 is a clear fit) and the
 * number the slide quotes. The strongest one becomes the person's role.
 */
function roleScores(person, groupSize) {
  const share = (count) => (person.messages ? count / person.messages : 0);
  const written = Math.max(person.written, 1);
  const avgWords = person.words / written;
  const reply = person.medianReplyMin;
  const fairShare = 1 / Math.max(groupSize, 2);

  return [
    {
      id: "nightOwl",
      score: share(person.night) / 0.22,
      value: round(share(person.night) * 100),
    },
    {
      id: "earlyBird",
      score: share(person.morning) / 0.22,
      value: round(share(person.morning) * 100),
    },
    { id: "novelist", score: avgWords / 16, value: round(avgWords) },
    {
      id: "minimalist",
      score: avgWords > 0 ? 2.6 / avgWords : 0,
      value: round(avgWords, 1),
    },
    {
      id: "speedster",
      score: reply === null ? 0 : 1.6 / (reply + 0.6),
      value: reply === null ? 0 : Math.max(1, round(reply)),
    },
    {
      id: "ghost",
      score: reply === null ? 0 : reply / 75,
      value: reply === null ? 0 : round(reply),
    },
    {
      id: "starter",
      score: person.startShare / (fairShare * 1.45),
      value: round(person.startShare * 100),
    },
    {
      id: "emojiPoet",
      score: person.emoji / written / 1.1,
      value: round(person.emoji / written, 1),
    },
    {
      id: "machineGun",
      score: person.avgBurst / 3.2,
      value: round(person.avgBurst, 1),
    },
    {
      id: "interrogator",
      score: person.questions / written / 0.35,
      value: round((person.questions / written) * 100),
    },
    {
      id: "comedian",
      score: person.laughs / written / 0.28,
      value: round((person.laughs / written) * 100),
    },
    {
      id: "paparazzi",
      score: share(person.media) / 0.22,
      value: round(share(person.media) * 100),
    },
  ];
}

/**
 * One role each, strongest fit first — and no two people the same one while
 * there is another that fits at least half as well, because two Night Owls
 * is a duller slide than a Night Owl and a Novelist. Every role quotes its
 * own number, so a weaker fit is still true.
 */
function assignRoles(people) {
  const taken = new Set();
  const order = [...people].sort((a, b) => b.messages - a.messages);
  for (const person of order) {
    if (person.written < MIN_MESSAGES_FOR_PROFILE) continue;
    // Capped, so one habit taken to the extreme (a thirty-message monologue)
    // does not outvote everything else about a person by a factor of ten.
    const ranked = roleScores(person, people.length)
      .map((role) => ({ ...role, score: Math.min(role.score, 2) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const fresh = ranked.find(
      (role) => !taken.has(role.id) && role.score >= best.score * 0.5,
    );
    const role = fresh || best;
    taken.add(role.id);
    person.role = { id: role.id, value: role.value };
  }
}

/** The words a person uses far more than everyone else here. */
function signatureWords(person, totals, limit) {
  return [...person.wordCounts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([word, count]) => ({
      word,
      count,
      score: (count / (totals.get(word) || count)) * Math.log(1 + count),
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, limit)
    .map(({ word, count }) => ({ word, count }));
}

function chronotypeOf(hours, total, peakHour) {
  const lateNight =
    [22, 23, 0, 1, 2, 3].reduce((sum, hour) => sum + hours[hour], 0) / total;
  if (lateNight >= 0.25) return "nightOwls";
  if (peakHour >= 5 && peakHour <= 10) return "earlyBirds";
  if (peakHour >= 11 && peakHour <= 14) return "lunchBreakers";
  if (peakHour >= 17 && peakHour <= 22) return "eveningCrew";
  if (peakHour >= 23 || peakHour <= 4) return "nightOwls";
  return "officeHours";
}

/**
 * @param {Array<{date: Date, author: string|null, message: string, attachment?: object}>} messages
 *   One year of one chat, system notices already removed.
 */
export function getHighlights(messages) {
  const sorted = messages
    .filter((message) => message.author && message.date)
    .map((message) => ({ ...message, date: new Date(message.date) }))
    .filter((message) => !Number.isNaN(message.date.getTime()))
    .sort((a, b) => a.date - b.date);
  if (!sorted.length) return null;

  const byName = new Map();
  const hours = new Array(24).fill(0);
  const weekdays = new Array(7).fill(0);
  const perDay = new Map();

  let previous = null;
  let burstAuthor = null;
  let burstLength = 0;
  const burstLengths = new Map();
  let silence = { ms: 0, start: null, end: null };

  const closeBurst = () => {
    if (!burstAuthor) return;
    const list = burstLengths.get(burstAuthor) || [];
    list.push(burstLength);
    burstLengths.set(burstAuthor, list);
  };

  for (const message of sorted) {
    const { author, date } = message;
    if (!byName.has(author)) byName.set(author, newPerson(author));
    const person = byName.get(author);
    const hour = date.getHours();

    readMessage(person, message, hour);
    hours[hour] += 1;
    weekdays[date.getDay()] += 1;
    const key = dayKey(date);
    perDay.set(key, (perDay.get(key) || 0) + 1);

    const gap = previous ? date - previous.date : Infinity;
    if (gap >= CONVERSATION_GAP_MS) {
      person.starts += 1;
    } else if (previous.author !== author) {
      person.replyMinutes.push(gap / 60000);
    }
    if (previous && gap > silence.ms) {
      silence = { ms: gap, start: previous.date, end: date };
    }

    if (author !== burstAuthor || gap >= CONVERSATION_GAP_MS) {
      closeBurst();
      burstAuthor = author;
      burstLength = 0;
    }
    burstLength += 1;
    previous = message;
  }
  closeBurst();

  const total = sorted.length;
  const everyone = [...byName.values()].sort((a, b) => b.messages - a.messages);
  const conversations = everyone.reduce((sum, p) => sum + p.starts, 0);
  const wordTotals = new Map();
  for (const person of everyone) {
    const bursts = burstLengths.get(person.name) || [];
    person.avgBurst = bursts.length
      ? bursts.reduce((sum, length) => sum + length, 0) / bursts.length
      : 1;
    person.medianReplyMin =
      person.replyMinutes.length >= MIN_REPLIES
        ? median(person.replyMinutes)
        : null;
    person.startShare = conversations ? person.starts / conversations : 0;
    for (const [word, count] of person.wordCounts) {
      wordTotals.set(word, (wordTotals.get(word) || 0) + count);
    }
  }

  const named = everyone.slice(0, MAX_PEOPLE);
  assignRoles(named);
  const moments = getMoments(sorted);

  // Streak: the longest run of calendar days with at least one message.
  const days = [...perDay.keys()].sort();
  let streak = { days: 0, start: null, end: null };
  let run = { days: 0, start: null, last: null };
  let busiestDay = { date: days[0], count: 0 };
  for (const key of days) {
    const [y, m, d] = key.split("-").map(Number);
    const number = Date.UTC(y, m - 1, d) / 86400000;
    run =
      run.last !== null && number - run.last === 1
        ? { days: run.days + 1, start: run.start, last: number }
        : { days: 1, start: key, last: number };
    if (run.days > streak.days) {
      streak = { days: run.days, start: run.start, end: key };
    }
    if (perDay.get(key) > busiestDay.count) {
      busiestDay = { date: key, count: perDay.get(key) };
    }
  }

  const first = sorted[0].date;
  const last = sorted[total - 1].date;
  const daysInSpan = dayNumber(last) - dayNumber(first) + 1;
  const peakHour = hours.indexOf(Math.max(...hours));
  const words = everyone.reduce((sum, person) => sum + person.words, 0);
  const emojiTotals = new Map();
  for (const person of everyone) {
    for (const [emoji, count] of person.emojiCounts) {
      emojiTotals.set(emoji, (emojiTotals.get(emoji) || 0) + count);
    }
  }
  const topEmoji = [...emojiTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const people = named.map((person) => {
    const personTopEmoji = [...person.emojiCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    const age = textingAge(person);
    return {
      name: person.name,
      messages: person.messages,
      share: round(person.messages / total, 4),
      words: person.words,
      avgWords: round(person.words / Math.max(person.written, 1), 1),
      media: person.media,
      topEmoji: personTopEmoji ? personTopEmoji[0] : null,
      medianReplyMin:
        person.medianReplyMin === null ? null : round(person.medianReplyMin, 1),
      starts: person.starts,
      startShare: round(person.startShare, 4),
      nightShare: round(person.night / person.messages, 4),
      age: age ? age.age : null,
      ageReasons: age ? age.reasons : [],
      ageEmoji: age ? age.emoji : null,
      role: person.role || null,
      words3: signatureWords(person, wordTotals, 3),
      ...moments.people.get(person.name),
    };
  });

  const daysActive = days.length;
  const chemistry =
    everyone.length === 2 &&
    everyone.every((person) => person.messages >= MIN_MESSAGES_FOR_PROFILE)
      ? getChemistry(people, { daysActive, daysInSpan })
      : null;

  return {
    version: HIGHLIGHTS_VERSION,
    year: last.getFullYear(),
    isGroup: everyone.length > 2,
    peopleCount: everyone.length,
    totals: {
      messages: total,
      words,
      media: everyone.reduce((sum, person) => sum + person.media, 0),
      daysActive,
      daysInSpan,
      perActiveDay: round(total / days.length),
      firstDate: dayKey(first),
      lastDate: dayKey(last),
      conversations,
      topEmoji: topEmoji ? topEmoji[0] : null,
    },
    people,
    hours,
    weekdays,
    peakHour,
    // Midnight to five: the share nobody plans to send.
    afterMidnightShare: round(
      [0, 1, 2, 3, 4].reduce((sum, hour) => sum + hours[hour], 0) / total,
      4,
    ),
    chronotype: chronotypeOf(hours, total, peakHour),
    busiestDay,
    streak,
    silence: {
      hours: round(silence.ms / 3600000, 1),
      days: Math.floor(silence.ms / 86400000),
      start: silence.start ? dayKey(silence.start) : null,
      end: silence.end ? dayKey(silence.end) : null,
    },
    chemistry,
    stuff: moments.stuff,
    funniest: moments.funniest,
    burst: moments.burst,
    waited: moments.waited,
    marathon: moments.marathon,
    latestNight: moments.latestNight,
  };
}
