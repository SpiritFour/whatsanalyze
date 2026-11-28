import { contrast, resolveStyle, textOn } from "~/utils/pdf/chatDesign";
import { allChatFontFaceCss, chatFontFamily } from "~/utils/pdf/chatFonts";
import { messageToHtml } from "~/utils/pdf/emoji";
import { block, emojiText, words, wrapWords } from "~/utils/pdf/html";
import { TEXT_SIZES } from "~/utils/pdf/chatStyles";
import type { ChatStyle, ChatViewOptions } from "~/utils/pdf/chatStyles";
import type { ChatCoverContent, ChatOutroContent } from "~/utils/pdf/chatPages";
import type { ChatAnalysisLabels } from "~/utils/pdf/chatAnalysis";
import { getAttachment } from "~/utils/attachments";
import type { AttachmentSource } from "~/utils/attachments";

/**
 * The chat, drawn like the conversation on a phone, as one piece of HTML that
 * three consumers share:
 *
 * - the live preview on the WhatsApp-to-PDF page (inside a shadow root),
 * - the browser's own print dialog (`@media print` below, and the `chat` named
 *   page in `chatPrintGlobalCss`),
 * - the PDF engine, which lays the same markup out and transcribes it
 *   (utils/pdf/chatPdf.ts).
 *
 * So what the preview shows is what the PDF prints: one template, one
 * stylesheet. Everything is under `.cv-root` and `cv-` class names, so it can
 * sit in a page without leaking styles into it.
 */

export const CHAT_CHAPTER = "chat";

/** `@page { size }` for each paper. */
const PAGE_SIZE_CSS: Record<string, string> = {
  a4: "A4",
  letter: "letter",
  a5: "A5",
};

export interface ChatViewMessage {
  author: string;
  message: string;
  date: Date | string;
  isSystem: boolean;
  media?: { dataUrl: string; format: string } | null;
}

export interface ChatViewLabels {
  /** "161 messages · 2 Jan 2021 – 25 Jul 2021" */
  subtitle: string;
  /** Shown after the last message of a preview; empty for the full chat. */
  notice?: string;
  /** The PDF's first page (utils/pdf/chatPages.ts). */
  cover?: ChatCoverContent;
  /** The PDF's last page, on a preview only. */
  outro?: ChatOutroContent | null;
  /** The analysis pages after the cover (utils/pdf/chatAnalysis.ts). */
  analysis?: ChatAnalysisLabels;
}

export interface ChatViewDocument {
  title: string;
  labels: ChatViewLabels;
  messages: ChatViewMessage[];
  colors: Record<string, string>;
  locale: string;
  /** Profile pictures by participant (data URLs), where uploaded (Pro). */
  avatars?: Record<string, string>;
  /** Messages per month in the whole document, for the compact book layout
   * (a part rendered alone cannot count the months it does not hold). */
  monthCounts?: Record<string, number>;
}

type Context = "screen" | "pdf";

/** Messages whose text is only the "file attached" line of a shown photo. */
function isAttachmentLine(text: string, fileName: string): boolean {
  const trimmed = text.trim();
  return trimmed.includes(fileName) && trimmed.length <= fileName.length + 24;
}

async function toDataUrl(data: Uint8Array, mimeType: string): Promise<string> {
  const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: mimeType });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * The chat's messages as the view needs them, with photos read from the
 * export. Audio, video and missing files keep their "file attached" line.
 */
export async function prepareChatMessages(
  messages: any[],
  attachments: AttachmentSource[],
  participants: string[],
  { showMedia }: { showMedia: boolean },
): Promise<ChatViewMessage[]> {
  const known = new Set(participants);
  const prepared: ChatViewMessage[] = [];

  for (const message of messages) {
    const isSystem =
      !message.author ||
      message.author.toLowerCase() === "system" ||
      (known.size > 0 && !known.has(message.author));
    let media: ChatViewMessage["media"] = null;
    let text: string = message.message || "";

    const fileName = message.attachment?.fileName;
    if (showMedia && fileName) {
      try {
        const attachment = await getAttachment(fileName, attachments);
        if (attachment.mimeTypeData.renderInPDF && attachment.src) {
          const isPng =
            attachment.mimeTypeData.mimeTypeEnding.toLowerCase() === "png";
          media = {
            dataUrl: await toDataUrl(
              attachment.src,
              isPng ? "image/png" : "image/jpeg",
            ),
            format: isPng ? "PNG" : "JPEG",
          };
          if (isAttachmentLine(text, fileName)) text = "";
        }
      } catch (error) {
        console.error("Could not read an attachment for the chat view", error);
      }
    }

    prepared.push({
      author: message.author,
      message: text,
      date: message.date,
      isSystem,
      media,
    });
  }

  return prepared;
}

function dayKey(date: Date | string): string {
  const value = new Date(date);
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

function dayLabel(date: Date | string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(
      new Date(date),
    );
  } catch {
    return new Date(date).toDateString();
  }
}

function timeLabel(date: Date | string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || "")
    .join("");
  return letters.toUpperCase() || "?";
}

function nameColor(
  style: ChatStyle,
  colors: Record<string, string>,
  author: string,
): string {
  if (!style.colorNames) return style.name;
  const color = colors[author];
  // A participant's colour only where it reads on the incoming bubble: a
  // custom bubble colour can be anything.
  return color &&
    /^#[0-9a-f]{6}$/i.test(color) &&
    contrast(color, style.bubbleIn) >= 3
    ? color
    : style.name;
}

/**
 * Where a long chat rendered in parts left off, so the next part carries on
 * the same day and the same run of messages instead of starting afresh.
 */
export interface ChatViewState {
  previousDay: string;
  previousAuthor: string;
  /** Book layout: the month the last chapter opened with (YYYY-MM). */
  previousMonth?: string;
  /** Book layout: the chapter now being written, and each chapter's last
   * month, for a footer such as "March – April 2021". */
  chapter?: string;
  chapterEnds?: Record<string, string>;
}

/** Compact book layout: a month with fewer messages joins the page before. */
export const COMPACT_MONTH_LIMIT = 25;

/** Messages per month (YYYY-MM). */
export function countByMonth(
  messages: Array<{ date: Date | string }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const message of messages) {
    const key = monthKey(message.date);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function monthKey(date: Date | string): string {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date | string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return monthKey(date);
  }
}

/** A message's day as YYYY-MM-DD, in the local time zone like the export. */
function isoDay(date: Date | string): string {
  const value = new Date(date);
  return `${monthKey(value)}-${String(value.getDate()).padStart(2, "0")}`;
}

/**
 * The messages a document shows, after the content filters: WhatsApp's own
 * notices left out on request, and only the chosen days. The preview, the
 * printout and the PDF all go through this, so they count the same messages.
 */
export function filterChatMessages<
  T extends { author?: string; date: Date | string },
>(
  messages: T[],
  options: Pick<ChatViewOptions, "hideSystem" | "from" | "to">,
  participants: string[],
): T[] {
  const known = new Set(participants);
  const { hideSystem, from, to } = options;
  if (!hideSystem && !from && !to) return messages;
  return messages.filter((message) => {
    if (hideSystem) {
      const author = message.author;
      const system =
        !author ||
        author.toLowerCase() === "system" ||
        (known.size > 0 && !known.has(author));
      if (system) return false;
    }
    const day = isoDay(message.date);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });
}

/** At most this many circles in a group's header; the rest become "+N". */
const MAX_AVATARS = 5;

/**
 * The circles at the start of the chat header: the other person in a
 * one-on-one chat, every other member of a group. A circle shows the
 * uploaded picture where there is one, otherwise the initials on the
 * participant's colour, in whichever text colour reads on it.
 */
function avatarsHtml(
  people: string[],
  doc: ChatViewDocument,
  style: ChatStyle,
  sprite: Map<string, string>,
): string {
  if (!people.length) return "";
  const group = people.length > 1 ? " is-group" : "";
  const circles = faceCircles(people, doc, style, sprite, {
    max: MAX_AVATARS,
    className: `cv-avatar${group}`,
    more: `cv-avatar is-group" style="background:${style.dayBackground};color:${style.dayText}`,
  });
  return `<div class="cv-avatars">${circles.join("")}</div>`;
}

/**
 * One circle per person, at most `max` of them with the last one a "+N" for
 * the rest: the uploaded picture where there is one, otherwise the initials
 * on the participant's colour, in whichever text colour reads on it.
 */
function faceCircles(
  people: string[],
  faces: Pick<ChatViewDocument, "colors" | "avatars">,
  style: ChatStyle,
  sprite: Map<string, string>,
  { max, className, more }: { max: number; className: string; more: string },
): string[] {
  const shown = people.length > max ? people.slice(0, max - 1) : people;
  const rest = people.length - shown.length;

  const circles = shown.map((name) => {
    const photo = faces.avatars?.[name];
    if (photo) {
      return `<img class="${className} is-photo" src="${photo}" data-format="JPEG" alt="">`;
    }
    const color =
      faces.colors[name] && /^#[0-9a-f]{6}$/i.test(faces.colors[name])
        ? faces.colors[name]
        : style.name;
    return `<div class="${className}" style="background:${color};color:${textOn(
      color,
    )}">${emojiText(initials(name), sprite)}</div>`;
  });
  if (rest > 0) circles.push(`<div class="${more}">${words(`+${rest}`)}</div>`);
  return circles;
}

/** At most this many circles on the cover; the rest become "+N". */
const MAX_COVER_FACES = 8;

/**
 * The cover's row of circles: everyone in the chat, the person printing it
 * included. Styled by chatPagesCss (utils/pdf/chatPages.ts).
 */
export function coverFacesHtml(
  people: string[],
  faces: Pick<ChatViewDocument, "colors" | "avatars">,
  options: ChatViewOptions,
  sprite: Map<string, string> = new Map(),
): string {
  if (!people.length || options.cover?.faces === false) return "";
  const size = people.length > 4 ? " is-small" : "";
  const circles = faceCircles(people, faces, resolveStyle(options), sprite, {
    max: MAX_COVER_FACES,
    className: `cp-face${size}`,
    more: `cp-face cp-face-more${size}`,
  });
  return `<div class="cp-faces">${circles.join("")}</div>`;
}

/** The whole chat view: header, day separators, bubbles, preview notice. */
export function chatViewHtml(
  doc: ChatViewDocument,
  options: ChatViewOptions,
  sprite: Map<string, string> = new Map(),
  part: { header?: boolean; state?: ChatViewState } = {},
): string {
  const { header = true, state = { previousDay: "", previousAuthor: "" } } =
    part;
  const style = resolveStyle(options);
  // Book layout: every month is its own chapter, so it starts a fresh page
  // and its pages can say which month they are in.
  const chapterOf = (date: Date | string) =>
    options.book ? `${CHAT_CHAPTER}-${monthKey(date)}` : CHAT_CHAPTER;
  let chapter =
    state.chapter ??
    (doc.messages.length ? chapterOf(doc.messages[0].date) : CHAT_CHAPTER);
  const chapterEnds = (state.chapterEnds ??= {});
  const monthCounts = doc.monthCounts ?? countByMonth(doc.messages);
  const others = Object.keys(doc.colors).filter((name) => name !== options.me);

  let html = "";
  if (header) {
    html += block(
      chapter,
      `<div class="cv-header">
       ${avatarsHtml(others, doc, style, sprite)}
       <div class="cv-header-text">
         <div class="cv-title">${emojiText(doc.title, sprite)}</div>
         <div class="cv-subtitle">${words(doc.labels.subtitle)}</div>
       </div>
     </div>`,
      { breakBefore: true, keepWithNext: true },
    );
  }

  let { previousDay, previousAuthor } = state;
  let previousMonth = state.previousMonth ?? "";

  for (const message of doc.messages) {
    if (options.book) {
      const month = monthKey(message.date);
      if (month !== previousMonth) {
        // Compact: a quiet month carries on where the last one ended, as
        // part of its chapter, instead of taking a page for two messages.
        const joins =
          options.bookCompact &&
          !!previousMonth &&
          (monthCounts[month] ?? 0) < COMPACT_MONTH_LIMIT;
        if (!joins) chapter = chapterOf(message.date);
        chapterEnds[chapter] = month;
        html += block(
          chapter,
          `<div class="cv-month">${words(monthLabel(message.date, doc.locale))}</div>`,
          // The chat's header shares the first month's page.
          { keepWithNext: true, breakBefore: !!previousMonth && !joins },
        );
        previousMonth = month;
        previousDay = "";
      }
    }

    const day = dayKey(message.date);
    if (day !== previousDay) {
      html += block(
        chapter,
        `<div class="cv-day"><span class="cv-day-label">${words(
          dayLabel(message.date, doc.locale),
        )}</span></div>`,
        { keepWithNext: true },
      );
      previousDay = day;
      previousAuthor = "";
    }

    if (message.isSystem) {
      html += block(
        chapter,
        `<div class="cv-system"><span class="cv-system-label">${wrapWords(
          messageToHtml(message.message, sprite),
        )}</span></div>`,
      );
      previousAuthor = "";
      continue;
    }

    const isOut = message.author === options.me;
    const isFollowUp = message.author === previousAuthor;
    previousAuthor = message.author;

    const name =
      options.showNames && !isOut && !isFollowUp
        ? `<div class="cv-name" style="color:${nameColor(
            style,
            doc.colors,
            message.author,
          )}">${emojiText(message.author, sprite)}</div>`
        : "";
    const media = message.media
      ? `<div class="cv-media"><img src="${message.media.dataUrl}" data-format="${message.media.format}" alt=""></div>`
      : "";
    const text = message.message
      ? `<div class="cv-text">${wrapWords(
          messageToHtml(message.message, sprite),
        )}</div>`
      : "";
    const time = options.showTimes
      ? `<div class="cv-time">${words(timeLabel(message.date, doc.locale))}</div>`
      : "";

    html += block(
      chapter,
      `<div class="cv-bubble">${name}${media}${text}${time}</div>`,
      {
        className: [
          "cv-msg",
          isOut ? "is-out" : "is-in",
          isFollowUp ? "is-follow-up" : "",
        ]
          .filter(Boolean)
          .join(" "),
      },
    );
  }

  state.previousDay = previousDay;
  state.previousAuthor = previousAuthor;
  state.previousMonth = previousMonth;
  state.chapter = chapter;

  if (doc.labels.notice) {
    html += block(
      chapter,
      `<div class="cv-notice">${words(doc.labels.notice)}</div>`,
    );
  }

  return html;
}

/**
 * The stylesheet, for one style and set of adjustments. `screen` adds the
 * wallpaper and padding the preview needs; in the PDF the page itself is the
 * wallpaper and the margins come from the page geometry.
 */
export function chatViewCss(
  options: ChatViewOptions,
  context: Context,
): string {
  const s = resolveStyle(options);
  const size = TEXT_SIZES[options.textSize];
  const small = Math.round(size * 0.78 * 10) / 10;
  const tiny = Math.round(size * 0.72 * 10) / 10;

  return `
.cv-root {
  font-family: ${chatFontFamily(options.font)};
  color: ${s.text};
  font-size: ${size}px;
  line-height: 1.4;
  text-align: left;
  ${
    context === "screen"
      ? `background: ${s.page}; padding: 16px 14px 20px; border-radius: 14px;`
      : "background: transparent;"
  }
}
.cv-root *, .cv-root *::before, .cv-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.cv-root img { border: 0; }

.cv-header {
  display: flex; align-items: center; gap: 12px;
  background: ${s.header}; color: ${s.headerText};
  border-radius: 12px; padding: 10px 14px; margin-bottom: 10px;
}
.cv-avatars { display: flex; flex: none; gap: 4px; }
.cv-avatar {
  flex: none; width: 38px; height: 38px; border-radius: 19px;
  display: flex; align-items: center; justify-content: center;
  color: #ffffff; font-weight: 700; font-size: 15px; line-height: 1;
}
.cv-avatar.is-group { width: 32px; height: 32px; border-radius: 16px; font-size: 12px; }
img.cv-avatar { display: block; }
.cv-header-text { min-width: 0; }
.cv-title { font-weight: 700; font-size: ${Math.round(size * 1.2)}px; overflow-wrap: anywhere; }
.cv-subtitle { color: ${s.headerMuted}; font-size: ${small}px; padding-top: 2px; }

.cv-month {
  font-size: ${Math.round(size * 2.1)}px; font-weight: 700; line-height: 1.2;
  color: ${textOn(s.page)}; padding: 18px 0 10px;
}

.cv-day { display: flex; justify-content: center; padding: 10px 0 8px; }
.cv-day-label {
  background: ${s.dayBackground}; color: ${s.dayText};
  font-size: ${small}px; border-radius: ${s.dayRadius}px; padding: 4px 12px;
}

.cv-system { display: flex; justify-content: center; padding: 2px 0 8px; }
.cv-system-label {
  max-width: 82%; text-align: center;
  background: ${s.systemBackground}; color: ${s.systemText};
  font-size: ${small}px; border-radius: 8px; padding: 5px 12px;
  white-space: pre-wrap; overflow-wrap: anywhere;
}

.cv-msg { display: flex; padding-top: 6px; }
.cv-msg.is-follow-up { padding-top: 2px; }
.cv-msg.is-out { justify-content: flex-end; }

.cv-bubble {
  max-width: 78%; min-width: 64px;
  border-radius: ${s.radius}px; padding: 6px 10px 5px;
  background: ${s.bubbleIn};
}
.is-out .cv-bubble { background: ${s.bubbleOut}; color: ${s.textOut ?? s.text}; }
.is-out .cv-time { color: ${s.mutedOut ?? s.muted}; }

.cv-name { font-weight: 700; font-size: ${small}px; padding-bottom: 2px; overflow-wrap: anywhere; }
.cv-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.cv-media { padding: 2px 0 4px; }
.cv-media img { display: block; max-width: 100%; max-height: 360px; border-radius: ${Math.max(
    4,
    s.radius - 6,
  )}px; }
.cv-time { color: ${s.muted}; font-size: ${tiny}px; text-align: right; padding-top: 1px; }

.cv-notice {
  margin-top: 16px; padding: 10px 14px; border-radius: 10px;
  background: ${s.header}; color: ${s.headerText};
  font-size: ${small}px; text-align: center;
}

/* Emoji: artwork in the PDF (see utils/pdf/emoji.ts), the system font on
   screen, sized the same either way. */
.cv-root .wa-emoji { display: inline-block; height: 1.15em; width: 1.15em; vertical-align: -0.2em; margin: 0 0.05em; }

@media print {
  .cv-root {
    padding: 0; border-radius: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cv-header, .cv-msg, .cv-system, .cv-notice { break-inside: avoid; page-break-inside: avoid; }
  .cv-day, .cv-header { break-after: avoid; page-break-after: avoid; }
  .cv-media img { max-height: 110mm; }
}
`;
}

/**
 * Document-level CSS for printing the chat with the browser's own print
 * dialog. It has to live in the page, not the preview's shadow root: fonts
 * and `@page` rules only apply from the document.
 *
 * While `html.cv-printing` is set (see the tool's beforeprint handler) only
 * `#cv-print-root` is printed, on A4 sheets in the style's colours.
 */
export function chatPrintGlobalCss(
  options: ChatViewOptions,
  fontFaceCss: string,
): string {
  const s = resolveStyle(options);
  const size = PAGE_SIZE_CSS[options.paper] ?? "A4";
  return `
${fontFaceCss}
${allChatFontFaceCss()}
@page chat { size: ${size}; margin: 12mm; background: ${s.page}; }
/* For engines without named pages (Safari): no page margins at all, so
   there is no white frame around the wallpaper and no room for the
   browser's own URL and date; the chat is inset by padding instead. */
@page { size: ${size}; margin: 0; }
#cv-print-root { display: none; }
@media print {
  html.cv-printing, html.cv-printing body {
    background: ${s.page} !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  html.cv-printing body > *:not(#cv-print-root) { display: none !important; }
  html.cv-printing #cv-print-root { display: block; page: chat; }
  @supports not (page: chat) {
    html.cv-printing #cv-print-root {
      padding: 12mm;
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
    }
  }
}
`;
}
