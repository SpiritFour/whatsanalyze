import { chatFontFamily } from "~/utils/pdf/chatFonts";
import {
  isDark,
  mix,
  mutedOn,
  resolveStyle,
  textOn,
} from "~/utils/pdf/chatDesign";
import { readableAccent } from "~/utils/pdf/chatPages";
import { block, emojiText, words } from "~/utils/pdf/html";
import type { ChatViewOptions } from "~/utils/pdf/chatStyles";

/**
 * The analysis pages of the chat PDF: the numbers the analyzer shows on
 * screen, printed between the cover and the chat.
 *
 * The analyzer's charts are canvases on its page, and the WhatsApp to PDF
 * tool has none, so these are not pictures of them: every bar is an HTML box
 * that the PDF engine draws as a vector rectangle, in the chosen design's
 * colours. They are computed from the messages the document shows (after
 * the content filters), and from all of them on a preview: the preview
 * leaves messages out, not the overview.
 */

export const ANALYSIS_CHAPTER = "analysis";

export interface ChatAnalysisLabels {
  title: string;
  perDay: string;
  busiestDay: string;
  busiestHour: string;
  perPerson: string;
  timeline: string;
  timeOfDay: string;
  weekdays: string;
  funFacts: string;
  words: string;
  wordsPerMessage: string;
  uniqueWords: string;
  longestMessage: string;
  messages: string;
  /** "Others", for the people past the twelfth. */
  others: string;
}

interface PersonStats {
  name: string;
  messages: number;
  words: number;
  uniqueWords: number;
  /** Characters in the longest message. */
  longest: number;
}

export interface ChatAnalysis {
  total: number;
  days: number;
  busiestDay: { date: Date; count: number } | null;
  busiestHour: { hour: number; count: number } | null;
  /** Most messages first. */
  people: PersonStats[];
  timeline: { unit: "day" | "month" | "quarter" | "year"; buckets: Bucket[] };
  /** Messages per hour of the day, 0–23. */
  hours: number[];
  /** Messages per weekday, Monday first. */
  weekdays: number[];
}

interface Bucket {
  start: Date;
  count: number;
}

interface AnalysedMessage {
  date: Date | string;
  author: string;
  message?: string;
}

const DAY_MS = 86_400_000;
/** At most this many columns in the timeline: months, else quarters, else years. */
const MAX_COLUMNS = 40;
/** Up to this many days, the timeline has a column per day. */
const MAX_DAY_COLUMNS = 62;
/** People listed one by one; the rest are summed up as "Others". */
const MAX_PEOPLE = 12;

const WORD = /[\p{L}\p{N}']+/gu;

export function analyseChat(
  messages: AnalysedMessage[],
  participants: string[],
): ChatAnalysis {
  const people = new Map<string, PersonStats & { vocabulary: Set<string> }>();
  for (const name of participants) {
    people.set(name, {
      name,
      messages: 0,
      words: 0,
      uniqueWords: 0,
      longest: 0,
      vocabulary: new Set(),
    });
  }

  const hours = new Array(24).fill(0);
  const weekdays = new Array(7).fill(0);
  const perDay = new Map<number, number>();
  const perMonth = new Map<number, number>();
  let first: Date | null = null;
  let last: Date | null = null;
  let total = 0;

  for (const message of messages) {
    const person = people.get(message.author);
    // WhatsApp's own notices count for nobody.
    if (!person) continue;
    const date = new Date(message.date);
    if (Number.isNaN(date.getTime())) continue;
    total++;
    first ??= date;
    last = date;

    const text = String(message.message ?? "");
    person.messages++;
    person.longest = Math.max(person.longest, text.length);
    for (const word of text.toLowerCase().match(WORD) ?? []) {
      person.words++;
      person.vocabulary.add(word);
    }

    hours[date.getHours()]++;
    weekdays[(date.getDay() + 6) % 7]++;
    const day = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    const month = date.getFullYear() * 12 + date.getMonth();
    perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
  }

  let busiestDay: ChatAnalysis["busiestDay"] = null;
  for (const [day, count] of perDay) {
    if (!busiestDay || count > busiestDay.count) {
      busiestDay = { date: new Date(day), count };
    }
  }
  const peak = Math.max(...hours);
  const busiestHour = total ? { hour: hours.indexOf(peak), count: peak } : null;

  return {
    total,
    days:
      first && last
        ? Math.round(
            (Date.UTC(last.getFullYear(), last.getMonth(), last.getDate()) -
              Date.UTC(
                first.getFullYear(),
                first.getMonth(),
                first.getDate(),
              )) /
              DAY_MS,
          ) + 1
        : 0,
    busiestDay,
    busiestHour,
    people: [...people.values()]
      .filter((person) => person.messages > 0)
      .map(({ vocabulary, ...person }) => ({
        ...person,
        uniqueWords: vocabulary.size,
      }))
      .sort((a, b) => b.messages - a.messages),
    timeline: timelineOf(perDay, perMonth, first, last),
    hours,
    weekdays,
  };
}

/** Months between the first and last message, grouped to fit the page. */
function timelineOf(
  perDay: Map<number, number>,
  perMonth: Map<number, number>,
  first: Date | null,
  last: Date | null,
): ChatAnalysis["timeline"] {
  if (!first || !last) return { unit: "month", buckets: [] };

  // A short chat: a column per day, not one or two for its months.
  const firstDay = new Date(
    first.getFullYear(),
    first.getMonth(),
    first.getDate(),
  );
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  if (
    Math.round((lastDay.getTime() - firstDay.getTime()) / DAY_MS) <
    MAX_DAY_COLUMNS
  ) {
    const buckets: Bucket[] = [];
    for (
      let day = new Date(firstDay);
      day <= lastDay;
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    ) {
      buckets.push({ start: day, count: perDay.get(day.getTime()) ?? 0 });
    }
    return { unit: "day", buckets };
  }

  const from = first.getFullYear() * 12 + first.getMonth();
  const to = last.getFullYear() * 12 + last.getMonth();
  const span = to - from + 1;
  const [unit, size] =
    span <= MAX_COLUMNS
      ? (["month", 1] as const)
      : span <= MAX_COLUMNS * 3
        ? (["quarter", 3] as const)
        : (["year", 12] as const);

  // Quarters and years start on their calendar boundary.
  const start = from - (from % size);
  const buckets: Bucket[] = [];
  for (let month = start; month <= to; month += size) {
    let count = 0;
    for (let m = month; m < month + size; m++) count += perMonth.get(m) ?? 0;
    buckets.push({
      start: new Date(Math.floor(month / 12), month % 12, 1),
      count,
    });
  }
  return { unit, buckets };
}

// ----- HTML -----------------------------------------------------------------

function format(locale: string, value: number, digits = 0): string {
  return value.toLocaleString(locale, { maximumFractionDigits: digits });
}

function bucketLabel(
  locale: string,
  unit: ChatAnalysis["timeline"]["unit"],
  date: Date,
): string {
  try {
    if (unit === "year") return String(date.getFullYear());
    if (unit === "day") {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        date,
      );
    }
    if (unit === "quarter") {
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    }
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function weekdayNames(locale: string): string[] {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, index) => {
    try {
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
        new Date(2024, 0, 1 + index),
      );
    } catch {
      return "";
    }
  });
}

function hourLabel(locale: string, hour: number): string {
  try {
    return new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(
      new Date(2024, 0, 1, hour),
    );
  } catch {
    return String(hour);
  }
}

/** A row of columns, tallest = full height; labels under some of them. */
function columns(
  values: number[],
  labels: Array<string | null>,
  color: string,
): string {
  const max = Math.max(1, ...values);
  const bars = values
    .map((value) => {
      const height = value > 0 ? Math.max(1.5, (value / max) * 100) : 0;
      return `<div class="ca-col"><div class="ca-col-bar" style="height:${height.toFixed(
        2,
      )}%;background:${color}"></div></div>`;
    })
    .join("");
  const axis = labels
    .map(
      (label) => `<div class="ca-axis-cell">${label ? words(label) : ""}</div>`,
    )
    .join("");
  return `<div class="ca-cols">${bars}</div><div class="ca-axis">${axis}</div>`;
}

function section(title: string, body: string): string {
  return block(
    ANALYSIS_CHAPTER,
    `<div class="ca-section">
       <div class="ca-heading">${words(title)}</div>
       ${body}
     </div>`,
  );
}

function personColor(
  colors: Record<string, string>,
  name: string,
  fallback: string,
) {
  const color = colors[name];
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

export function chatAnalysisHtml(
  analysis: ChatAnalysis,
  labels: ChatAnalysisLabels,
  colors: Record<string, string>,
  locale: string,
  options: ChatViewOptions,
  sprite: Map<string, string> = new Map(),
): string {
  if (!analysis.total) return "";
  const accent = analysisAccent(options);

  // Title and the three headline numbers.
  const facts = [
    {
      value: format(locale, analysis.total / Math.max(1, analysis.days), 1),
      label: labels.perDay,
    },
    analysis.busiestDay && {
      value: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        analysis.busiestDay.date,
      ),
      label: `${labels.busiestDay} · ${format(locale, analysis.busiestDay.count)} ${labels.messages}`,
    },
    analysis.busiestHour && {
      value: hourLabel(locale, analysis.busiestHour.hour),
      label: labels.busiestHour,
    },
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  let html = block(
    ANALYSIS_CHAPTER,
    `<div class="ca-title">${words(labels.title)}</div>
     <div class="ca-facts">${facts
       .map(
         (fact) =>
           `<div class="ca-fact"><div class="ca-fact-value">${words(
             fact.value,
           )}</div><div class="ca-fact-label">${words(fact.label)}</div></div>`,
       )
       .join("")}</div>`,
    { breakBefore: true, keepWithNext: true },
  );

  // Messages per person: one bar each, longest = most messages.
  const listed = analysis.people.slice(0, MAX_PEOPLE);
  const rest = analysis.people.slice(MAX_PEOPLE);
  const rows = [
    ...listed.map((person) => ({
      name: emojiText(person.name, sprite),
      count: person.messages,
      color: personColor(colors, person.name, accent),
    })),
    ...(rest.length
      ? [
          {
            name: words(`${labels.others} (${rest.length})`),
            count: rest.reduce((sum, person) => sum + person.messages, 0),
            color: accent,
          },
        ]
      : []),
  ];
  const most = Math.max(1, ...rows.map((row) => row.count));
  html += section(
    labels.perPerson,
    `<div class="ca-people">${rows
      .map(
        (row) =>
          `<div class="ca-person">
             <div class="ca-person-name">${row.name}</div>
             <div class="ca-person-track"><div class="ca-person-bar" style="width:${(
               (row.count / most) *
               100
             ).toFixed(2)}%;background:${row.color}"></div></div>
             <div class="ca-person-count">${words(
               `${format(locale, row.count)} · ${format(
                 locale,
                 (row.count / analysis.total) * 100,
               )}%`,
             )}</div>
           </div>`,
      )
      .join("")}</div>`,
  );

  // The timeline: its first, middle and last column named, spread under
  // it (a name under its own column would run off a narrow one).
  const buckets = analysis.timeline.buckets;
  const ends = [
    buckets[0],
    buckets.length > 2 ? buckets[Math.floor((buckets.length - 1) / 2)] : null,
    buckets.length > 1 ? buckets.at(-1) : null,
  ].filter(Boolean) as Bucket[];
  html += section(
    labels.timeline,
    columns(
      buckets.map((bucket) => bucket.count),
      [],
      accent,
    ) +
      `<div class="ca-axis ca-axis--spread">${ends
        .map(
          (bucket) =>
            `<div>${words(bucketLabel(locale, analysis.timeline.unit, bucket.start))}</div>`,
        )
        .join("")}</div>`,
  );

  html += section(
    labels.timeOfDay,
    columns(
      analysis.hours,
      analysis.hours.map((_, hour) =>
        hour % 6 === 0 ? hourLabel(locale, hour) : null,
      ),
      accent,
    ),
  );

  html += section(
    labels.weekdays,
    columns(analysis.weekdays, weekdayNames(locale), accent),
  );

  // Fun facts: a card per person, two to a row.
  const cards = listed.map((person) => {
    const line = (value: string, label: string) =>
      `<div class="ca-card-line"><span class="ca-card-value">${words(
        value,
      )}</span> ${words(label)}</div>`;
    return `<div class="ca-card">
       <div class="ca-card-name"><span class="ca-dot" style="background:${personColor(
         colors,
         person.name,
         accent,
       )}"></span>${emojiText(person.name, sprite)}</div>
       ${line(format(locale, person.words), labels.words)}
       ${line(format(locale, person.words / Math.max(1, person.messages), 1), labels.wordsPerMessage)}
       ${line(format(locale, person.uniqueWords), labels.uniqueWords)}
       ${line(format(locale, person.longest), labels.longestMessage)}
     </div>`;
  });
  html += block(
    ANALYSIS_CHAPTER,
    `<div class="ca-heading ca-heading--alone">${words(labels.funFacts)}</div>`,
    { keepWithNext: true },
  );
  for (let index = 0; index < cards.length; index += 2) {
    html += block(
      ANALYSIS_CHAPTER,
      `<div class="ca-cards">${cards.slice(index, index + 2).join("")}</div>`,
    );
  }
  return html;
}

/**
 * The bars' colour: a custom style's accent, else WhatsApp's darker teal,
 * which keeps 3:1 against the light and the dark presets (the brand's own
 * teal is too light on the beige page and would fall back to black).
 */
function analysisAccent(options: ChatViewOptions): string {
  const s = resolveStyle(options);
  const color = options.style === "ink" ? "#555555" : (s.accent ?? BAR_TEAL);
  return readableAccent(color, s.page);
}

const BAR_TEAL = "#128c7e";

export function chatAnalysisCss(options: ChatViewOptions): string {
  const s = resolveStyle(options);
  const page = s.page;
  const text = textOn(page);
  const muted = mutedOn(page);
  const card = mix(page, text, isDark(page) ? 0.14 : 0.08);
  const track = mix(page, text, isDark(page) ? 0.1 : 0.05);

  return `
.ca-title, .ca-section, .ca-heading, .ca-facts, .ca-cards { font-family: ${chatFontFamily(options.font)}; color: ${text}; }
.ca-title { font-size: 28px; font-weight: 700; padding-top: 6px; }
.ca-title--shots { padding-bottom: 14px; }
.ca-shot { display: flex; justify-content: center; padding-bottom: 14px; }
.ca-shot img { display: block; }
.ca-facts { display: flex; gap: 12px; padding: 16px 0 6px; }
.ca-fact { flex: 1; background: ${card}; border-radius: 12px; padding: 12px 14px; }
.ca-fact-value { font-size: 20px; font-weight: 700; color: ${textOn(card)}; }
.ca-fact-label { font-size: 11px; color: ${mutedOn(card)}; padding-top: 2px; }

.ca-section { padding-top: 22px; }
.ca-heading { font-size: 15px; font-weight: 700; padding-bottom: 10px; }
.ca-heading--alone { padding-top: 22px; }

.ca-people { display: flex; flex-direction: column; gap: 7px; }
.ca-person { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.ca-person-name { width: 28%; flex: none; overflow: hidden; white-space: nowrap; }
.ca-person-track { flex: 1; height: 14px; background: ${track}; border-radius: 7px; }
.ca-person-bar { height: 14px; border-radius: 7px; }
.ca-person-count { width: 92px; flex: none; text-align: right; color: ${muted}; white-space: nowrap; }

.ca-cols { display: flex; align-items: flex-end; gap: 2px; height: 110px; background: ${track}; border-radius: 8px; padding: 8px 8px 0; }
.ca-col { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.ca-col-bar { width: 100%; border-radius: 2px; }
.ca-axis { display: flex; gap: 2px; padding: 4px 8px 0; }
.ca-axis--spread { justify-content: space-between; font-size: 10px; color: ${muted}; }
.ca-axis-cell { flex: 1; font-size: 10px; color: ${muted}; white-space: nowrap; overflow: visible; }

.ca-cards { display: flex; gap: 12px; padding-bottom: 12px; }
.ca-card { flex: 1; max-width: calc(50% - 6px); background: ${card}; border-radius: 12px; padding: 12px 14px; color: ${textOn(card)}; }
.ca-card-name { font-size: 13px; font-weight: 700; padding-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.ca-dot { width: 10px; height: 10px; border-radius: 5px; flex: none; }
.ca-card-line { font-size: 11px; color: ${mutedOn(card)}; padding-top: 2px; }
.ca-card-value { font-weight: 700; color: ${textOn(card)}; }
`;
}

// ----- the analyzer's own cards ----------------------------------------------

/** A card of the analysis page, captured as a picture (AnalyticsCapture.vue). */
export interface AnalyticsImage {
  dataUrl: string;
  /** CSS px, as laid out on the page. */
  width: number;
  height: number;
}

/**
 * The analysis page's cards as they look there: Chart.js charts, word and
 * emoji clouds, highlights and fun facts. Each is as wide as the page allows
 * and never taller than a page, so a tall one is scaled down rather than cut.
 */
export function chatAnalyticsImagesHtml(
  images: AnalyticsImage[],
  labels: ChatAnalysisLabels,
  page: { width: number; height: number },
): string {
  if (!images.length) return "";
  // room for the title above the first, and a little air
  const maxHeight = page.height - 24;
  let html = block(
    ANALYSIS_CHAPTER,
    `<div class="ca-title ca-title--shots">${words(labels.title)}</div>`,
    { breakBefore: true, keepWithNext: true },
  );
  for (const image of images) {
    const scale = Math.min(page.width / image.width, maxHeight / image.height);
    const width = Math.floor(image.width * scale);
    const height = Math.floor(image.height * scale);
    html += block(
      ANALYSIS_CHAPTER,
      `<div class="ca-shot"><img src="${image.dataUrl}" data-format="JPEG" alt="" style="width:${width}px;height:${height}px"></div>`,
    );
  }
  return html;
}
