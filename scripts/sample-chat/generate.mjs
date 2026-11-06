/**
 * Writes static/sample/chat.txt, the chat behind "Try With Sample Chat": a
 * year of Emma and Leo, made up from start to finish, in the shape of an
 * Android export.
 *
 * The story (scenes.mjs) is written out; the days in between (everyday.mjs)
 * are drawn from a fixed seed, so a run writes the same file every time. It
 * has to: the sample's AI readings in static/sample/ai/ were made from
 * exactly this text. Change anything here and run
 * scripts/sample-chat/readings.mjs again too.
 *
 * usage: node scripts/sample-chat/generate.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { QUIET_DAYS, SCENES, TOGETHER_DAYS } from "./scenes.mjs";
import { CLOSERS, EVERYDAY, SHIFT, SLOTS, TERSE } from "./everyday.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "static/sample/chat.txt");
const NAMES = { E: "Emma", L: "Leo" };
const OTHER = { E: "L", L: "E" };
/** Added now and then to a plain line, more often while it's warm. */
const EMOJI = {
  E: ["❤️", "😂", "🥰", "✨", "😘"],
  L: ["😄", "❤️", "😂"],
};

/**
 * How they text in each part of the story: how many conversations a day,
 * how often Emma starts them, how long each takes to answer (minutes), and
 * how warm and how short Leo is.
 */
const PHASES = [
  {
    until: "2025-10-31",
    threads: [3, 5],
    emmaFirst: 0.5,
    delay: { E: [0, 4], L: [0, 4] },
    warmth: 1,
    terse: 0,
    skip: 0,
  },
  {
    until: "2025-12-31",
    threads: [2, 3],
    emmaFirst: 0.55,
    delay: { E: [0, 8], L: [0, 12] },
    warmth: 0.85,
    terse: 0,
    skip: 0.03,
  },
  {
    until: "2026-03-31",
    threads: [1, 3],
    emmaFirst: 0.58,
    delay: { E: [0, 12], L: [1, 25] },
    warmth: 0.7,
    terse: 0.03,
    skip: 0.06,
  },
  {
    until: "2026-07-31",
    threads: [1, 3],
    emmaFirst: 0.72,
    delay: { E: [0, 15], L: [5, 120] },
    warmth: 0.5,
    terse: 0.25,
    skip: 0.1,
  },
  {
    until: "2026-10-24",
    threads: [0, 2],
    emmaFirst: 0.9,
    // Under five hours: utils/inactivity.js counts a message after six as
    // starting a new conversation, and these are late answers, not that.
    delay: { E: [1, 20], L: [40, 290] },
    warmth: 0.3,
    terse: 0.6,
    skip: 0.25,
  },
];

/** Minutes after midnight each kind of conversation can start in. */
const WINDOWS = {
  morning: [7 * 60, 9 * 60 + 30],
  day: [11 * 60 + 30, 16 * 60 + 30],
  evening: [18 * 60, 21 * 60 + 45],
  late: [22 * 60 + 30, 24 * 60 + 15],
};
const SLOT_ORDER = ["morning", "day", "evening", "late"];

// mulberry32: small, seedable, and the same on every machine.
let seed = 20261106;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = ([lo, hi]) => lo + rand() * (hi - lo);
const int = ([lo, hi]) => Math.floor(lo + rand() * (hi - lo + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;

const DAY = 24 * 60;
const toDay = (iso) => Date.parse(`${iso}T00:00:00Z`) / 60_000;
const isoOf = (minutes) =>
  new Date(minutes * 60_000).toISOString().slice(0, 10);
const clock = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const phaseOf = (iso) => PHASES.find((p) => iso <= p.until) ?? PHASES.at(-1);

const ID = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
/** Fill a line's slots, never with the same thing twice ("pizza or pizza"). */
function fill(text) {
  const used = new Set();
  return text.replace(/\{(\w+)\}/g, (_, slot) => {
    if (slot === "id") {
      return Array.from({ length: 11 }, () => pick([...ID])).join("");
    }
    const options = SLOTS[slot].filter((option) => !used.has(option));
    const choice = pick(options.length ? options : SLOTS[slot]);
    used.add(choice);
    return choice;
  });
}

const hasEmoji = (text) => /\p{Extended_Pictographic}/u.test(text);
const plain = (text) => !/^<|^https?:|\n/.test(text);

/** Every message, as [minutes since 1970 UTC, "E" | "L", text]. */
const messages = [];
const say = (at, who, text) => messages.push([at, who, text]);

// The story
const sceneStart = new Map();
for (const scene of SCENES) {
  const day = toDay(scene.date);
  let at = null;
  for (const line of scene.lines) {
    const [time, who, text] = line.split("|");
    at = time ? day + clock(time) : at + Math.round(between([0, 2]));
    say(at, who, text);
  }
  const first = clock(scene.lines[0].split("|")[0]);
  sceneStart.set(
    scene.date,
    Math.min(sceneStart.get(scene.date) ?? DAY, first),
  );
}

/** When the story next has something to say, so nothing talks over it. */
const storyTimes = SCENES.map(
  (scene) => toDay(scene.date) + clock(scene.lines[0].split("|")[0]),
).sort((a, b) => a - b);
const nextStory = (at) => storyTimes.find((t) => t > at) ?? Infinity;

/**
 * One everyday exchange from `start`; returns when it ended. A slow answer
 * that would land in the middle of one of the story's moments is never sent.
 */
function exchange(start, first, item, phase) {
  const until = nextStory(start) - 15;
  let at = start;
  let prev = null;
  for (const [role, said] of item.lines) {
    const who = role === "a" ? first : OTHER[first];
    const raw = Array.isArray(said) ? pick(said) : said;
    if (prev) {
      at += Math.round(
        who === prev ? between([0, 1.5]) : between(phase.delay[who]),
      );
      if (at > until) return at;
    }
    let text = fill(raw);
    let ends = false;
    // Pulling away: Leo's answers shrink to a word, and the talk stops there.
    if (who === "L" && prev === "E" && chance(phase.terse)) {
      text = pick(TERSE);
      ends = chance(0.6);
    } else if (
      plain(text) &&
      !hasEmoji(text) &&
      chance(phase.warmth * (who === "L" ? 0.14 : 0.2))
    ) {
      text = `${text} ${pick(EMOJI[who])}`;
    }
    say(at, who, text);
    prev = who;
    if (ends) break;
  }
  // Once Leo answers in a word, Emma tends to have the last one. It's how
  // these chats go, and it keeps her next morning's first message from
  // counting as a slow reply to his (utils/inactivity.js counts any answer
  // within a day as one).
  const cool = phase.terse >= 0.25;
  if (prev === "L" && chance(cool ? 0.75 : 0.3)) {
    const closeAt = at + Math.round(between(phase.delay.E));
    if (closeAt <= until) {
      at = closeAt;
      say(at, "E", pick(cool ? CLOSERS.cool : CLOSERS.warm));
    }
  }
  // Now and then a photo, or a message thought better of.
  if (chance(phase.warmth * 0.1)) {
    const who = pick(["E", "L"]);
    say(at + 1, who, "<Media omitted>");
    if (chance(0.7)) {
      say(at + 2, OTHER[who], pick(["😍", "haha", "cute", "love this", "😂"]));
    }
    at += 2;
  }
  if (chance(0.006)) say(at + 1, pick(["E", "L"]), "This message was deleted");
  return at;
}

/** How often each exchange came up: the rarer, the likelier next. */
const uses = new Map();
function leastUsed(items) {
  const weights = items.map((item) => 1 / (1 + (uses.get(item) ?? 0)) ** 2);
  let r = rand() * weights.reduce((sum, w) => sum + w, 0);
  return items.find((_, i) => (r -= weights[i]) < 0) ?? items.at(-1);
}

const shiftNight = (iso) => {
  // Every third week from mid-October, Monday and Wednesday nights.
  const week = Math.floor((toDay(iso) - toDay("2025-10-13")) / (7 * DAY));
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return week >= 0 && week % 3 === 0 && (weekday === 1 || weekday === 3);
};

// The days in between
for (let day = toDay("2025-09-13"); day <= toDay("2026-10-24"); day += DAY) {
  const iso = isoOf(day);
  if (QUIET_DAYS.includes(iso) || TOGETHER_DAYS.includes(iso)) continue;
  const phase = phaseOf(iso);

  // Not on a night the story already fills, nor its morning.
  if (shiftNight(iso) && (sceneStart.get(iso) ?? DAY) >= 10 * 60) {
    const [[, note], ...rest] = pick(SHIFT);
    const at = day + Math.round(between([90, 270]));
    say(at, "E", Array.isArray(note) ? pick(note) : note);
    let morning = day + Math.round(between([7 * 60, 8 * 60 + 30]));
    for (const [who, text] of rest) {
      say(
        morning,
        who,
        who === "L" && chance(phase.terse) ? pick(TERSE) : text,
      );
      morning += Math.round(between([0, 3]));
    }
  }
  if (chance(phase.skip)) continue;

  // A day the story happens on keeps to the hours before it.
  const storyAt = sceneStart.get(iso) ?? DAY + 60;
  const lastStart = iso === "2026-10-24" ? 20 * 60 : storyAt - 90;
  const wantLate = phaseOf(iso) === PHASES[0] ? 0.8 : 0.35;
  const slots = SLOT_ORDER.filter(
    (slot) =>
      WINDOWS[slot][0] < lastStart && (slot !== "late" || chance(wantLate)),
  );
  const count = Math.min(int(phase.threads), slots.length);
  const chosen = slots
    .map((slot) => [rand(), slot])
    .sort((a, b) => a[0] - b[0])
    .slice(0, count)
    .map(([, slot]) => slot)
    .sort((a, b) => SLOT_ORDER.indexOf(a) - SLOT_ORDER.indexOf(b));

  const weekday = ![0, 6].includes(new Date(day * 60_000).getUTCDay());
  let free = day;
  for (const slot of chosen) {
    const [open, close] = WINDOWS[slot];
    const start = Math.max(day + Math.round(between([open, close])), free + 20);
    if (start - day > Math.min(close + 120, lastStart)) break;
    const first = chance(phase.emmaFirst) ? "E" : "L";
    const items = EVERYDAY.filter(
      (item) =>
        item.slot === slot &&
        (!item.who || item.who === first) &&
        (!item.weekday || weekday) &&
        (!item.max || (uses.get(item) ?? 0) < item.max) &&
        (!item.from || iso >= item.from) &&
        (!item.until || iso <= item.until),
    );
    if (!items.length) continue;
    const item = leastUsed(items);
    uses.set(item, (uses.get(item) ?? 0) + 1);
    free = exchange(start, first, item, phase);
  }
}

messages.sort((a, b) => a[0] - b[0]);

const stamp = (minutes) => {
  const d = new Date(minutes * 60_000);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${String(d.getUTCFullYear()).slice(2)}, ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
};
const lines = [
  `${stamp(messages[0][0])} - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.`,
  ...messages.map(([at, who, text]) => `${stamp(at)} - ${NAMES[who]}: ${text}`),
];
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${lines.join("\n")}\n`);

// What it came out as, to check the story still shows in the numbers.
const byMonth = new Map();
for (const [at, who] of messages) {
  const month = isoOf(at).slice(0, 7);
  const row = byMonth.get(month) ?? { E: 0, L: 0 };
  row[who] += 1;
  byMonth.set(month, row);
}
console.log(`${messages.length} messages → ${OUT}`);
for (const [month, row] of byMonth) {
  console.log(`  ${month}  Emma ${row.E}  Leo ${row.L}`);
}
