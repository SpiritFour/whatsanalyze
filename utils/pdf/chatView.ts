import { contrast, resolveStyle } from "~/utils/pdf/chatDesign";
import { messageToHtml } from "~/utils/pdf/emoji";
import { block, words, wrapWords } from "~/utils/pdf/html";
import { TEXT_SIZES } from "~/utils/pdf/chatStyles";
import type { ChatStyle, ChatViewOptions } from "~/utils/pdf/chatStyles";
import type { ChatCoverContent, ChatOutroContent } from "~/utils/pdf/chatPages";
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
}

export interface ChatViewDocument {
  title: string;
  labels: ChatViewLabels;
  messages: ChatViewMessage[];
  colors: Record<string, string>;
  locale: string;
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
  const chapter = CHAT_CHAPTER;
  const others = Object.keys(doc.colors).filter((name) => name !== options.me);
  const avatarColor =
    others.length === 1 ? nameColor(style, doc.colors, others[0]) : style.name;

  let html = "";
  if (header) {
    html += block(
      chapter,
      `<div class="cv-header">
       <div class="cv-avatar" style="background:${avatarColor}">${words(
         initials(doc.title),
       )}</div>
       <div class="cv-header-text">
         <div class="cv-title">${words(doc.title)}</div>
         <div class="cv-subtitle">${words(doc.labels.subtitle)}</div>
       </div>
     </div>`,
      { breakBefore: true, keepWithNext: true },
    );
  }

  let { previousDay, previousAuthor } = state;

  for (const message of doc.messages) {
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
          )}">${words(message.author)}</div>`
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
  font-family: "WaPdf", Helvetica, Arial, sans-serif;
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
.cv-avatar {
  flex: none; width: 38px; height: 38px; border-radius: 19px;
  display: flex; align-items: center; justify-content: center;
  color: #ffffff; font-weight: 700; font-size: 15px; line-height: 1;
}
.cv-header-text { min-width: 0; }
.cv-title { font-weight: 700; font-size: ${Math.round(size * 1.2)}px; overflow-wrap: anywhere; }
.cv-subtitle { color: ${s.headerMuted}; font-size: ${small}px; padding-top: 2px; }

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
  return `
${fontFaceCss}
@page chat { size: A4; margin: 12mm; background: ${s.page}; }
/* For engines without named pages (Safari): no page margins at all, so
   there is no white frame around the wallpaper and no room for the
   browser's own URL and date; the chat is inset by padding instead. */
@page { size: A4; margin: 0; }
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
