import moment from "moment";
import { COLORS } from "~/utils/pdf/theme";
import { escapeHtml, messageToHtml } from "~/utils/pdf/emoji";

/**
 * The document, as HTML.
 *
 * Every block carries `data-block` (the unit pagination keeps whole) and
 * `data-chapter` (which decides the page background). Every piece of text is
 * wrapped in a `.wa-w` span so the measuring pass gets one box per word
 * straight from the browser's line breaker, instead of re-implementing text
 * wrapping the way the old jsPDF code had to.
 */

export type Chapter = "cover" | "charts" | "facts" | "messages" | "outro";

export const CHAPTER_BACKGROUND: Record<Chapter, string> = {
  cover: COLORS.brand,
  charts: COLORS.light,
  facts: COLORS.brand,
  messages: COLORS.chatBackground,
  outro: COLORS.brand,
};

export interface ChartImage {
  img: string;
  width: number;
  height: number;
}

export interface MessageInput {
  author: string;
  message: string;
  date: Date | string;
  isEgo: boolean;
  isSystem: boolean;
  authorColor: string;
  attachment?: { dataUrl: string; format: string } | null;
}

/** Splits already-escaped markup into per-word spans, leaving `<img>` alone. */
function wrapWords(html: string): string {
  return html.replace(/(<img\b[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag;
    return (text as string).replace(
      /[^\s]+/g,
      (word: string) => `<span class="wa-w">${word}</span>`
    );
  });
}

/** Plain text that still needs a measurable box. */
function words(text: string): string {
  return wrapWords(escapeHtml(text));
}

function block(
  chapter: Chapter,
  html: string,
  { breakBefore = false, className = "" } = {}
): string {
  return `<div class="wa-block ${className}" data-block data-chapter="${chapter}"${
    breakBefore ? ' data-break-before="1"' : ""
  }>${html}</div>`;
}

export function coverBlocks(options: {
  title: string;
  logo: string;
  firstDate: Date | string;
  lastDate: Date | string;
  days: number;
  messageCount: number;
  peopleCount: number;
  personColorMap: Record<string, string>;
  labels: {
    firstMessage: string;
    lastMessage: string;
    days: string;
    messages: string;
    people: string;
  };
}): string {
  const {
    title,
    logo,
    firstDate,
    lastDate,
    days,
    messageCount,
    peopleCount,
    personColorMap,
    labels,
  } = options;

  const stat = (value: string, unit: string) =>
    `<div class="wa-stat"><span class="wa-stat-value">${words(
      value
    )}</span><span class="wa-stat-unit">${words(unit)}</span></div>`;

  const participants = Object.entries(personColorMap)
    .map(
      ([name, color]) =>
        `<div class="wa-participant" style="background:${bubbleColor(
          color
        )}">${words(name)}</div>`
    )
    .join("");

  return block(
    "cover",
    `<div class="wa-cover-brand">
       <div class="wa-cover-wordmark">${words("WhatsAnalyze")}</div>
       <img class="wa-cover-logo" src="${logo}" data-format="PNG" alt="">
     </div>
     <div class="wa-title">${words(title)}</div>
     <div class="wa-cover-dates">
       <div>
         <div class="wa-cover-date-label">${words(labels.firstMessage)}</div>
         <div class="wa-cover-date-value">${words(dayString(firstDate))}</div>
       </div>
       <div class="wa-cover-date-right">
         <div class="wa-cover-date-label">${words(labels.lastMessage)}</div>
         <div class="wa-cover-date-value">${words(dayString(lastDate))}</div>
       </div>
     </div>
     ${stat(String(days), labels.days)}
     ${stat(String(messageCount), labels.messages)}
     ${stat(String(peopleCount), labels.people)}
     <div class="wa-participants">${participants}</div>`,
    { breakBefore: true }
  );
}

export function chartBlocks(
  charts: Array<{ name: string; chart: ChartImage }>
): string {
  return charts
    .map(({ name, chart }, index) =>
      block(
        "charts",
        `<div class="wa-chart">
           <div class="wa-heading" style="color:${COLORS.onLight}">${words(
          name
        )}</div>
           <img src="${chart.img}" data-format="PNG" alt="">
         </div>`,
        { breakBefore: index === 0 }
      )
    )
    .join("");
}

export function factBlocks(
  heading: string,
  facts: Array<{ name: string; color: string; lines: string[] }>
): string {
  const headingBlock = block(
    "facts",
    `<div class="wa-heading" style="color:${COLORS.onLight}">${words(
      heading
    )}</div>`,
    { breakBefore: true }
  );

  const factHtml = facts
    .map((fact) =>
      block(
        "facts",
        `<div class="wa-fact">
           <div class="wa-participant" style="background:${bubbleColor(
             fact.color
           )};display:inline-block">${words(fact.name)}</div>
           <div class="wa-fact-lines">${fact.lines
             .map((line) => `<div class="wa-fact-line">${words(line)}</div>`)
             .join("")}</div>
         </div>`
      )
    )
    .join("");

  return headingBlock + factHtml;
}

export function daySeparatorBlock(date: Date | string): string {
  return block(
    "messages",
    `<div class="wa-day"><span class="wa-day-label">${words(
      dayString(date)
    )}</span></div>`
  );
}

export function messageBlock(
  message: MessageInput,
  sprite: Map<string, string>
): string {
  const classes = [
    "wa-message",
    message.isEgo ? "is-ego" : "",
    message.isSystem ? "is-system" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const attachment = message.attachment
    ? `<div class="wa-attachment"><img src="${message.attachment.dataUrl}" data-format="${message.attachment.format}" alt=""></div>`
    : "";

  const body = message.message
    ? `<div class="wa-text">${wrapWords(
        messageToHtml(message.message, sprite)
      )}</div>`
    : "";

  // The reader's own messages already stand out by side and bubble colour, and
  // a participant colour close to the ego bubble's teal is unreadable on it.
  const authorStyle = message.isEgo
    ? ""
    : ` style="color:${message.authorColor}"`;

  return block(
    "messages",
    `<div class="wa-bubble">
       <div class="wa-author"${authorStyle}>${words(message.author)}</div>
       ${attachment}
       ${body}
       <div class="wa-time">${words(timeString(message.date))}</div>
     </div>`,
    { className: classes }
  );
}

export function outroBlock(title: string, text: string): string {
  return block(
    "outro",
    `<div class="wa-outro-title">${words(title)}</div>
     <div class="wa-outro-text">${words(text)}</div>`,
    { breakBefore: true }
  );
}

/** Keeps a participant colour legible when it matches the page behind it. */
export function bubbleColor(color: string | undefined): string {
  if (!color) return COLORS.authorFallback;
  return color.toLowerCase() === COLORS.brand ? COLORS.authorFallback : color;
}

export function dayString(date: Date | string): string {
  return moment(date).format("dddd, MMMM Do YYYY");
}

export function timeString(date: Date | string): string {
  return moment(date).format("HH:mm");
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return moment(a).isSame(moment(b), "day");
}
