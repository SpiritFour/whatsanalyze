import {
  LAUGH,
  LINK,
  PHRASE_KINDS,
  PHRASES,
  isDeleted,
  isMedia,
  laughStrength,
  mediaKind,
  saysSomething,
  wasEdited,
  withoutEditMark,
} from "~/utils/wrapped/patterns";

/**
 * The moments of the year a chat remembers: the message that got the most
 * laughs, the double-texting record, the question left waiting, the longest
 * conversation, the latest night, what was said with feeling, and everything
 * sent besides words.
 *
 * Plain JSON out, like utils/wrapped/highlights.js, which calls this.
 */

/** A laugh this soon after someone else's message is a laugh at it. */
const LAUGH_WINDOW_MS = 15 * 60 * 1000;
/** Shorter gaps than this keep a conversation going, for the marathon. */
const MARATHON_GAP_MS = 20 * 60 * 1000;
/** A run of one person's messages ends where a conversation would. */
const CONVERSATION_GAP_MS = 6 * 60 * 60 * 1000;
const QUOTE_LENGTH = 160;

const pad = (value) => String(value).padStart(2, "0");
const dayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Short enough for a slide, cut at a word. */
function quote(text) {
  const clean = withoutEditMark(text).replace(/\s+/g, " ");
  if (clean.length <= QUOTE_LENGTH) return clean;
  const cut = clean.slice(0, QUOTE_LENGTH);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > QUOTE_LENGTH * 0.6 ? space : QUOTE_LENGTH).trimEnd()}…`;
}

const newPerson = () => ({
  deleted: 0,
  edited: 0,
  voice: 0,
  laughsCaused: 0,
  phrases: Object.fromEntries(PHRASE_KINDS.map((kind) => [kind, 0])),
});

/**
 * @param {Array<{date: Date, author: string, message: string, attachment?: object}>} sorted
 *   One year of one chat, oldest first, every message with an author.
 */
export function getMoments(sorted) {
  const people = new Map();
  const person = (name) => {
    if (!people.has(name)) people.set(name, newPerson());
    return people.get(name);
  };

  const stuff = {
    photo: 0,
    voice: 0,
    video: 0,
    sticker: 0,
    gif: 0,
    document: 0,
    contact: 0,
    other: 0,
    links: 0,
    deleted: 0,
    edited: 0,
  };

  // Laughs: whose message each one answers, and how many each message got.
  const lastBy = new Map();
  const laughsAt = new Map();

  let run = { author: null, count: 0, start: null, last: null };
  let burst = null;

  const pendingQuestions = new Map();
  let waited = null;

  let session = null;
  let marathon = null;
  const endSession = () => {
    if (!session || session.messages < 20) return;
    const minutes = Math.round((session.last - session.start) / 60000);
    if (!marathon || minutes > marathon.minutes) {
      marathon = {
        date: dayKey(session.start),
        minutes,
        messages: session.messages,
      };
    }
  };

  let latestNight = null;

  sorted.forEach((message, index) => {
    const { author, date } = message;
    const who = person(author);
    const media = isMedia(message);
    const deleted = !media && isDeleted(message.message);
    const text = media || deleted ? "" : withoutEditMark(message.message);

    // What was sent besides words.
    if (media) {
      const kind = mediaKind(message);
      stuff[kind] += 1;
      if (kind === "voice") who.voice += 1;
    } else if (deleted) {
      stuff.deleted += 1;
      who.deleted += 1;
    } else {
      if (wasEdited(message.message)) {
        stuff.edited += 1;
        who.edited += 1;
      }
      if (LINK.test(text)) stuff.links += 1;
      for (const kind of PHRASE_KINDS) {
        if (PHRASES[kind].test(text)) who.phrases[kind] += 1;
      }
    }

    // A laugh is a laugh at the last thing somebody else said, if it was
    // said a moment ago and was not itself just laughing.
    if (text && LAUGH.test(text)) {
      let target = null;
      for (const [name, entry] of lastBy) {
        if (name === author) continue;
        if (!target || entry.date > target.date) target = entry;
      }
      if (
        target &&
        date - target.date <= LAUGH_WINDOW_MS &&
        (target.media || LINK.test(target.text) || saysSomething(target.text))
      ) {
        person(target.author).laughsCaused += 1;
        // Quoted on a slide, so it has to be a sentence of their own.
        if (!target.media && saysSomething(target.text, 8)) {
          const got = laughsAt.get(target.index) || { laughs: 0, strength: 0 };
          got.laughs += 1;
          got.strength += laughStrength(text);
          laughsAt.set(target.index, got);
        }
      }
    }
    lastBy.set(author, { author, date, text, media, index });

    // The longest run of messages from one person before anyone answers.
    const gap = run.last ? date - run.last : Infinity;
    if (author === run.author && gap < CONVERSATION_GAP_MS) {
      run.count += 1;
      run.last = date;
    } else {
      run = { author, count: 1, start: date, last: date };
    }
    if (!burst || run.count > burst.count) {
      burst = { author: run.author, count: run.count, date: dayKey(run.start) };
    }

    // Questions left waiting: the first unanswered one of each person is
    // answered by the next message from anyone else.
    for (const [asker, question] of pendingQuestions) {
      if (asker === author) continue;
      const minutes = (date - question.date) / 60000;
      if (!waited || minutes > waited.minutes) {
        waited = {
          author: asker,
          text: question.text,
          minutes: Math.round(minutes),
          date: dayKey(question.date),
          answeredBy: author,
        };
      }
      pendingQuestions.delete(asker);
    }
    if (
      text.includes("?") &&
      (text.match(/\p{L}/gu) || []).length >= 2 &&
      !pendingQuestions.has(author)
    ) {
      pendingQuestions.set(author, { date, text: quote(text) });
    }

    // The longest conversation without a pause of twenty minutes.
    if (session && date - session.last < MARATHON_GAP_MS) {
      session.last = date;
      session.messages += 1;
    } else {
      endSession();
      session = { start: date, last: date, messages: 1 };
    }

    // The latest anyone was still writing, between midnight and five.
    const hour = date.getHours();
    if (hour < 5) {
      const clock = hour * 60 + date.getMinutes();
      if (!latestNight || clock >= latestNight.clock) {
        latestNight = {
          clock,
          author,
          date: dayKey(date),
          hour,
          minute: date.getMinutes(),
        };
      }
    }
  });

  endSession();

  // The message laughed at hardest: at length, or by several people, and
  // between equals the longer setup -- a joke, more likely than "toast".
  const letters = (text) => (text.match(/\p{L}/gu) || []).length;
  let funniest = null;
  for (const [index, { laughs, strength }] of laughsAt) {
    const message = sorted[index];
    const candidate = {
      author: message.author,
      text: quote(message.message),
      laughs,
      strength: Math.round(strength * 10) / 10,
      date: dayKey(message.date),
    };
    if (
      !funniest ||
      candidate.strength > funniest.strength ||
      (candidate.strength === funniest.strength &&
        (candidate.laughs > funniest.laughs ||
          (candidate.laughs === funniest.laughs &&
            letters(candidate.text) > letters(funniest.text))))
    ) {
      funniest = candidate;
    }
  }

  return {
    people,
    stuff,
    funniest,
    burst: burst && burst.count >= 5 ? burst : null,
    waited: waited && waited.minutes >= 60 ? waited : null,
    marathon: marathon && marathon.minutes >= 30 ? marathon : null,
    latestNight: latestNight
      ? {
          author: latestNight.author,
          date: latestNight.date,
          hour: latestNight.hour,
          minute: latestNight.minute,
        }
      : null,
  };
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * How in sync two people are, 50 to 99: who writes, who starts, how alike
 * their reply speed, whether they laugh at each other both ways, and how
 * many days they talked. A party trick, like the texting age, and the slide
 * says so.
 *
 * @param {Array<object>} pair Two people as highlights.js describes them.
 */
export function getChemistry(pair, { daysActive, daysInSpan }) {
  if (pair.length !== 2) return null;
  const [a, b] = pair;
  const parts = {
    balance: clamp01(1 - Math.abs(a.share - b.share)),
    starts: clamp01(1 - Math.abs(a.startShare - b.startShare)),
    presence: clamp01(daysActive / Math.max(daysInSpan, 1)),
    reply: null,
    laughs: null,
  };
  if (a.medianReplyMin !== null && b.medianReplyMin !== null) {
    const ratio =
      Math.max(a.medianReplyMin, b.medianReplyMin, 0.5) /
      Math.max(Math.min(a.medianReplyMin, b.medianReplyMin), 0.5);
    parts.reply = clamp01(1 - Math.log(ratio) / Math.log(20));
  }
  const laughsA = a.laughsCaused ?? 0;
  const laughsB = b.laughsCaused ?? 0;
  if (laughsA + laughsB >= 6) {
    parts.laughs = Math.min(laughsA, laughsB) / Math.max(laughsA, laughsB);
  }

  const weights = {
    balance: 0.25,
    starts: 0.15,
    presence: 0.25,
    reply: 0.15,
    laughs: 0.2,
  };
  let sum = 0;
  let weight = 0;
  for (const [key, value] of Object.entries(parts)) {
    if (value === null) continue;
    sum += value * weights[key];
    weight += weights[key];
  }
  const raw = weight ? sum / weight : 0;
  return {
    score: Math.round(50 + 49 * raw),
    parts: Object.fromEntries(
      Object.entries(parts).map(([key, value]) => [
        key,
        value === null ? null : Math.round(value * 100),
      ]),
    ),
  };
}
