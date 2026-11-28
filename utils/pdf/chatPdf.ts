import { resolveStyle } from "~/utils/pdf/chatDesign";
import {
  PdfBuilder,
  anyEmoji,
  nextFrame,
  paintFrame,
} from "~/utils/pdf/builder";
import { parseColor } from "~/utils/pdf/emit";
import { A4, contentHeightPx, mm } from "~/utils/pdf/page";
import type { PageGeometry } from "~/utils/pdf/page";
import { PAPER_SIZES } from "~/utils/pdf/chatStyles";
import type { ChatViewOptions, PaperId } from "~/utils/pdf/chatStyles";
import {
  CHAT_CHAPTER,
  countByMonth,
  chatViewCss,
  chatViewHtml,
  filterChatMessages,
  prepareChatMessages,
} from "~/utils/pdf/chatView";
import { charactersOf, fontsFor, loadChatFont } from "~/utils/pdf/chatFonts";
import type { ChatViewLabels, ChatViewState } from "~/utils/pdf/chatView";
import {
  COVER_CHAPTER,
  chatCoverHtml,
  chatOutroHtml,
  chatPagesCss,
  coverColor,
} from "~/utils/pdf/chatPages";
import logo from "~/assets/whatsanalyze-logo-green-PWA.png";
import type { AttachmentSource } from "~/utils/attachments";

/**
 * The WhatsApp-to-PDF export: the chat as it looks on a phone, in the style
 * picked on the page. It prints the exact markup the page previews
 * (utils/pdf/chatView.ts) through the shared HTML-to-PDF pipeline.
 */

/** 12 mm all round, plus a strip at the bottom for the page number. */
export const CHAT_GEOMETRY: PageGeometry = {
  ...A4,
  margin: { top: 12, right: 12, bottom: 12 + mm(18), left: 12 },
};

/** The sheet for a paper size; A5 gets slimmer margins for its small page. */
export function chatGeometry(paper: PaperId = "a4"): PageGeometry {
  const size = PAPER_SIZES[paper] ?? PAPER_SIZES.a4;
  const margin = paper === "a5" ? 9 : 12;
  return {
    ...size,
    margin: {
      top: margin,
      right: margin,
      bottom: margin + mm(18),
      left: margin,
    },
  };
}

const MESSAGES_PER_BATCH = 150;
export const CHAT_SAMPLE_COUNT = 100;

export interface RenderChatViewPdfOptions {
  chat: any;
  attachments: AttachmentSource[];
  options: ChatViewOptions;
  title: string;
  /** Builds the labels once the number of messages printed is known. */
  labels: (_printed: number, _total: number) => ChatViewLabels;
  locale: string;
  isSample?: boolean;
  onProgress?: (_percent: number) => void;
  /**
   * The design's pictures, prepared on the device: an A4-shaped JPEG behind
   * every chat page, and a cover photo. Only passed with Pro access.
   */
  assets?: {
    wallpaper?: string | null;
    coverPhoto?: string | null;
    /** Profile pictures by participant. */
    avatars?: Record<string, string>;
  };
}

export async function renderChatViewPdf(
  input: RenderChatViewPdfOptions,
): Promise<Blob> {
  const {
    chat,
    attachments,
    options: requested,
    title,
    labels,
    locale,
    isSample = false,
    onProgress,
    assets = {},
  } = input;
  // May fall back to the default font below; never mutates the caller's.
  let options = requested;

  const style = resolveStyle(options);
  const geometry = chatGeometry(options.paper);
  const colors = chat.personColorMap || {};
  const participants = Object.keys(colors);
  // The content filters first: the sample is the first 100 of what is left.
  const all = filterChatMessages(chat.chatObject, options, participants);
  const messages = isSample ? all.slice(0, CHAT_SAMPLE_COUNT) : all;
  // A font that lacks some of these letters would print gaps: such a chat is
  // printed in the default font, whatever was chosen.
  const fontId = fontsFor(
    charactersOf([
      ...messages.map((message: any) => message.message),
      ...participants,
      title,
    ]),
  ).includes(options.font)
    ? options.font
    : "default";
  if (fontId !== options.font) options = { ...options, font: fontId };
  const font = await loadChatFont(fontId);

  const builder = await PdfBuilder.create({
    geometry,
    css:
      chatViewCss(options, "pdf") +
      chatPagesCss(options, contentHeightPx(geometry)),
    fonts: font ? [font] : [],
    background: {
      value: style.page,
      chapters: { [COVER_CHAPTER]: coverColor(options) },
    },
    // The wallpaper is behind the chat and the outro; the cover has its own
    // colour and photo.
    backgroundImage: {
      value: assets.wallpaper ?? null,
      chapters: { [COVER_CHAPTER]: null },
    },
    // Names, titles and the cover's words can hold emoji as well.
    needsEmoji: anyEmoji([
      ...messages.map((message: any) => message.message),
      ...participants,
      title,
      options.cover?.title,
      options.cover?.dedication,
    ]),
  });

  try {
    const documentLabels = labels(messages.length, all.length);
    const state: ChatViewState = {
      previousDay: "",
      previousAuthor: "",
      previousMonth: "",
    };
    const monthCounts = countByMonth(messages);

    if (documentLabels.cover) {
      await builder.add(
        chatCoverHtml(
          documentLabels.cover,
          logo,
          assets.coverPhoto ?? null,
          builder.sprite,
        ),
      );
    }

    for (let start = 0; start < messages.length; start += MESSAGES_PER_BATCH) {
      const batch = messages.slice(start, start + MESSAGES_PER_BATCH);
      const prepared = await prepareChatMessages(
        batch,
        attachments,
        participants,
        { showMedia: options.showMedia },
      );
      const isFirst = start === 0;
      const isLast = start + batch.length >= messages.length;

      const html = chatViewHtml(
        {
          title,
          labels: {
            subtitle: documentLabels.subtitle,
            notice: isLast ? documentLabels.notice : "",
          },
          messages: prepared,
          colors,
          locale,
          avatars: assets.avatars ?? {},
          monthCounts,
        },
        options,
        builder.sprite,
        // The header belongs to the first batch only; later batches carry on
        // the same conversation.
        { header: isFirst, state },
      );

      await builder.add(`<div class="cv-root">${html}</div>`);
      onProgress?.(((start + batch.length) / messages.length) * 100);
      await nextFrame();
    }

    // What a preview left out, and where to get the rest.
    if (isSample && documentLabels.outro) {
      await builder.add(chatOutroHtml(documentLabels.outro, logo));
    }

    onProgress?.(100);
    await paintFrame();

    return await builder.finish(
      title,
      ({ doc, page, total, chapter, geometry }) => {
        // The cover is the title page; numbering it would be noise.
        if (chapter === COVER_CHAPTER) return;
        const [r, g, b] = parseColor(style.folio);
        doc.setTextColor(r, g, b);
        doc.setFontSize(7.5);
        if (font) doc.setFont(font.family, "normal");
        const y = geometry.heightMm - 8;
        // Book layout: each page says which month of the chat it is in.
        // A compact chapter can span quiet months: "March – April 2021".
        const start = chapter.startsWith(`${CHAT_CHAPTER}-`)
          ? chapter.slice(CHAT_CHAPTER.length + 1)
          : "";
        const end = state.chapterEnds?.[chapter] ?? start;
        const month = !start
          ? ""
          : end === start
            ? monthName(start, locale)
            : `${monthName(start, locale)} – ${monthName(end, locale)}`;
        doc.text(
          month ? `${title} · ${month}` : title,
          geometry.margin.left,
          y,
        );
        doc.text(
          `${page} / ${total}`,
          geometry.widthMm - geometry.margin.right,
          y,
          {
            align: "right",
          },
        );
      },
    );
  } finally {
    builder.destroy();
  }
}

/** "2021-03" as "March 2021" in the reader's language. */
function monthName(key: string, locale: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, 1));
  } catch {
    return key;
  }
}
