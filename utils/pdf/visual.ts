import {
  PdfBuilder,
  anyEmoji,
  nextFrame,
  paintFrame,
  toDataUrl,
} from "~/utils/pdf/builder";
import { parseColor } from "~/utils/pdf/emit";
import {
  CHAPTER_BACKGROUND,
  bubbleColor,
  chartBlocks,
  coverBlocks,
  daySeparatorBlock,
  factBlocks,
  isSameDay,
  messageBlock,
  outroBlock,
} from "~/utils/pdf/template";
import type { Chapter, ChartImage, MessageInput } from "~/utils/pdf/template";
import { COLORS, VISUAL_CSS, VISUAL_GEOMETRY } from "~/utils/pdf/theme";
import logoBlack from "~/assets/whatsanalyze-logo-black.png";
import { getAttachment } from "~/utils/attachments";
import type { AttachmentSource } from "~/utils/attachments";
import { chatDurationInDays, firstDate, lastDate } from "~/utils/utils";

/**
 * The visual chat export: cover, charts, fun facts and the conversation as
 * chat bubbles, rendered entirely on the device.
 *
 * The document is laid out as HTML/CSS in an offscreen frame, measured, and
 * transcribed into vector PDF operators -- so the browser does the typesetting
 * while the output keeps real, searchable text. See utils/pdf/builder.ts for
 * the pipeline and utils/pdf/emoji.ts for why emoji are artwork.
 */

const MESSAGES_PER_BATCH = 150;
const SAMPLE_MESSAGE_COUNT = 100;

const LABELS = {
  sampleTitle: "Your Sample",
  fullTitle: "Your Chat",
  firstMessage: "First Message",
  lastMessage: "Last Message",
  days: "days",
  messages: "messages",
  people: "people",
  funFacts: "Fun Facts",
  numberOfWords: "Number of Words: ",
  averageMessageLength: "Average Message Length: ",
  uniqueWords: "Unique words: ",
  longestMessage: "Characters in longest Message: ",
  sampleOutroTitle: "Get the full PDF at",
  outroTitle: "Thanks!",
  site: "whatsanalyze.com",
};

export interface RenderPdfOptions {
  chat: any;
  attachments: AttachmentSource[];
  ego: string;
  isSample?: boolean;
  charts: Array<{ name: string; chart: ChartImage }>;
  onProgress?: (_percent: number) => void;
}

async function resolveAttachment(
  message: any,
  attachments: AttachmentSource[],
): Promise<MessageInput["attachment"]> {
  if (!message.attachment?.fileName) return null;

  try {
    const attachment = await getAttachment(
      message.attachment.fileName,
      attachments,
    );
    // Audio, video and unknown files have no picture to show. The message text
    // still names the file, so the message is kept rather than dropped.
    if (!attachment.mimeTypeData.renderInPDF || !attachment.src) return null;

    const format = attachment.mimeTypeData.mimeTypeEnding.toLowerCase();
    return {
      dataUrl: await toDataUrl(
        attachment.src,
        format === "png" ? "image/png" : "image/jpeg",
      ),
      format,
    };
  } catch (error) {
    console.error("Could not read an attachment for the PDF", error);
    return null;
  }
}

export async function renderChatPdf(options: RenderPdfOptions): Promise<Blob> {
  const {
    chat,
    attachments,
    ego,
    isSample = false,
    charts,
    onProgress,
  } = options;

  const messages = isSample
    ? chat.chatObject.slice(0, SAMPLE_MESSAGE_COUNT)
    : chat.chatObject;

  const builder = await PdfBuilder.create({
    geometry: VISUAL_GEOMETRY,
    css: VISUAL_CSS,
    background: (chapter) => CHAPTER_BACKGROUND[chapter as Chapter] ?? null,
    needsEmoji: anyEmoji([
      ...messages.map((message: any) => message.message),
      ...Object.keys(chat.personColorMap || {}),
    ]),
  });

  try {
    const first = firstDate(chat);
    const last = lastDate(chat);

    await builder.add(
      coverBlocks({
        sprite: builder.sprite,
        title: isSample ? LABELS.sampleTitle : LABELS.fullTitle,
        logo: logoBlack,
        firstDate: first,
        lastDate: last,
        days: chatDurationInDays(first, last),
        messageCount: chat.chatObject.length,
        peopleCount: chat.numPersonsInChat,
        personColorMap: chat.personColorMap,
        labels: LABELS,
      }),
    );

    if (charts.length) await builder.add(chartBlocks(charts));

    const funFacts = await chat.getFunFacts();
    const facts = funFacts
      .filter((fact: any) => fact.name in chat.personColorMap)
      .map((fact: any) => ({
        name: fact.name,
        color: bubbleColor(chat.personColorMap[fact.name]),
        lines: [
          LABELS.numberOfWords + fact.numberOfWords,
          LABELS.averageMessageLength + fact.averageMessageLength,
          LABELS.uniqueWords + fact.uniqueWords,
          LABELS.longestMessage + fact.longestMessage,
        ],
      }));

    if (facts.length)
      await builder.add(factBlocks(LABELS.funFacts, facts, builder.sprite));

    let previousDate: Date | string | null = null;

    for (let start = 0; start < messages.length; start += MESSAGES_PER_BATCH) {
      const batch = messages.slice(start, start + MESSAGES_PER_BATCH);
      let html = "";

      for (const message of batch) {
        const isSystem =
          message.author === "System" ||
          !(message.author in chat.personColorMap);

        if (!previousDate || !isSameDay(previousDate, message.date)) {
          html += daySeparatorBlock(message.date);
        }
        previousDate = message.date;

        html += messageBlock(
          {
            author: message.author,
            message: message.message,
            date: message.date,
            isEgo: ego === message.author,
            isSystem,
            authorColor: bubbleColor(chat.personColorMap[message.author]),
            attachment: await resolveAttachment(message, attachments),
          },
          builder.sprite,
        );
      }

      await builder.add(html);

      onProgress?.(
        Math.min(100, ((start + batch.length) / messages.length) * 100),
      );
      await nextFrame();
    }

    await builder.add(
      isSample
        ? outroBlock(LABELS.sampleOutroTitle, LABELS.site)
        : outroBlock(LABELS.outroTitle, LABELS.site),
    );

    onProgress?.(100);
    await paintFrame();

    const title = `WhatsAnalyze — ${ego}`;
    return builder.finish(title, ({ doc, page, total, chapter, geometry }) => {
      // The cover is the title page; numbering it would be noise.
      if (chapter === "cover") return;

      const onDark =
        chapter === "messages" || chapter === "outro" || chapter === "facts";
      const [r, g, b] = parseColor(onDark ? COLORS.mutedText : "#6b7280");
      doc.setTextColor(r, g, b);
      doc.setFontSize(8);

      const margin = geometry.margin.left;
      doc.text(title, margin, margin / 2 + 2);
      doc.text(
        `Page ${page} of ${total}`,
        geometry.widthMm - margin,
        geometry.heightMm - margin / 2,
        { align: "right" },
      );
    });
  } finally {
    builder.destroy();
  }
}
