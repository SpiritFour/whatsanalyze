import { resolveStyle } from "~/utils/pdf/chatDesign";
import { PdfBuilder, anyEmoji, nextFrame } from "~/utils/pdf/builder";
import { parseColor } from "~/utils/pdf/emit";
import { A4, contentHeightPx, mm } from "~/utils/pdf/page";
import type { PageGeometry } from "~/utils/pdf/page";
import type { ChatViewOptions } from "~/utils/pdf/chatStyles";
import {
  chatViewCss,
  chatViewHtml,
  prepareChatMessages,
} from "~/utils/pdf/chatView";
import type { ChatViewLabels } from "~/utils/pdf/chatView";
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

const MESSAGES_PER_BATCH = 300;
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
  assets?: { wallpaper?: string | null; coverPhoto?: string | null };
}

export async function renderChatViewPdf(
  input: RenderChatViewPdfOptions,
): Promise<Blob> {
  const {
    chat,
    attachments,
    options,
    title,
    labels,
    locale,
    isSample = false,
    onProgress,
    assets = {},
  } = input;

  const style = resolveStyle(options);
  const all = chat.chatObject;
  const messages = isSample ? all.slice(0, CHAT_SAMPLE_COUNT) : all;
  const colors = chat.personColorMap || {};
  const participants = Object.keys(colors);

  const builder = await PdfBuilder.create({
    geometry: CHAT_GEOMETRY,
    css:
      chatViewCss(options, "pdf") +
      chatPagesCss(options, contentHeightPx(CHAT_GEOMETRY)),
    background: (chapter) =>
      chapter === COVER_CHAPTER ? coverColor(options) : style.page,
    // The wallpaper is behind the chat and the outro; the cover has its own
    // colour and photo.
    backgroundImage: (chapter) =>
      chapter === COVER_CHAPTER ? null : (assets.wallpaper ?? null),
    needsEmoji: anyEmoji(messages.map((message: any) => message.message)),
  });

  try {
    const documentLabels = labels(messages.length, all.length);
    const state = { previousDay: "", previousAuthor: "" };

    if (documentLabels.cover) {
      await builder.add(
        chatCoverHtml(documentLabels.cover, logo, assets.coverPhoto ?? null),
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

    return builder.finish(title, ({ doc, page, total, chapter, geometry }) => {
      // The cover is the title page; numbering it would be noise.
      if (chapter === COVER_CHAPTER) return;
      const [r, g, b] = parseColor(style.folio);
      doc.setTextColor(r, g, b);
      doc.setFontSize(7.5);
      const y = geometry.heightMm - 8;
      doc.text(title, geometry.margin.left, y);
      doc.text(
        `${page} / ${total}`,
        geometry.widthMm - geometry.margin.right,
        y,
        {
          align: "right",
        },
      );
    });
  } finally {
    builder.destroy();
  }
}
