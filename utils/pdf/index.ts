import { LayoutSurface } from "~/utils/pdf/document";
import { measureBlocks } from "~/utils/pdf/measure";
import { PdfWriter } from "~/utils/pdf/emit";
import { hasEmoji, loadEmojiSprite } from "~/utils/pdf/emoji";
import {
  chartBlocks,
  coverBlocks,
  daySeparatorBlock,
  factBlocks,
  isSameDay,
  messageBlock,
  outroBlock,
  bubbleColor,
} from "~/utils/pdf/template";
import type { ChartImage, MessageInput } from "~/utils/pdf/template";
import logoBlack from "~/assets/whatsanalyze-logo-black.png";
import { getAttachment } from "~/utils/attachments";
import { dateDiffs, firstDate, lastDate } from "~/utils/utils";

/**
 * Renders a chat as a PDF, entirely on the device.
 *
 * The document is laid out as HTML/CSS in an offscreen frame, measured, and
 * transcribed into vector PDF operators -- so the browser does the typesetting
 * while the output keeps real, searchable text. See utils/pdf/measure.ts for
 * the layout-to-PDF bridge and utils/pdf/emoji.ts for why emoji are artwork.
 *
 * This runs on the main thread by necessity: a Worker has no DOM, and the DOM
 * is the layout engine. Messages are therefore processed in batches with a
 * yield in between, so the progress bar keeps moving and the tab stays
 * responsive.
 */

const MESSAGES_PER_BATCH = 300;
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
  attachments: Array<{
    name: string;
    compressedContent?: Uint8Array;
    decompressedData?: Uint8Array;
  }>;
  ego: string;
  isSample?: boolean;
  charts: Array<{ name: string; chart: ChartImage }>;
  onProgress?: (percent: number) => void;
}

async function toDataUrl(data: Uint8Array, mimeType: string): Promise<string> {
  const blob = new Blob([data], { type: mimeType });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function resolveAttachment(
  message: any,
  attachments: RenderPdfOptions["attachments"]
): Promise<MessageInput["attachment"]> {
  if (!message.attachment?.fileName) return null;

  try {
    const attachment = await getAttachment(
      message.attachment.fileName,
      attachments
    );
    // Audio, video and unknown files have no picture to show. The message text
    // still names the file, so the message is kept rather than dropped.
    if (!attachment.mimeTypeData.renderInPDF || !attachment.src) return null;

    const format = attachment.mimeTypeData.mimeTypeEnding.toLowerCase();
    return {
      dataUrl: await toDataUrl(
        attachment.src,
        format === "png" ? "image/png" : "image/jpeg"
      ),
      format,
    };
  } catch (error) {
    console.error("Could not read an attachment for the PDF", error);
    return null;
  }
}

/** Does the transcript contain emoji at all? Decides whether to fetch artwork. */
function chatHasEmoji(messages: any[]): boolean {
  return messages.some(
    (message) => message.message && hasEmoji(message.message)
  );
}

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0));

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

  const sprite = chatHasEmoji(messages)
    ? await loadEmojiSprite()
    : new Map<string, string>();

  const surface = await LayoutSurface.create();
  const writer = new PdfWriter();

  try {
    const first = firstDate(chat);
    const last = lastDate(chat);

    await place(
      surface,
      writer,
      sprite,
      coverBlocks({
        title: isSample ? LABELS.sampleTitle : LABELS.fullTitle,
        logo: logoBlack,
        firstDate: first,
        lastDate: last,
        days: dateDiffs(first, last),
        messageCount: chat.chatObject.length,
        peopleCount: chat.numPersonsInChat,
        personColorMap: chat.personColorMap,
        labels: LABELS,
      })
    );

    if (charts.length) {
      await place(surface, writer, sprite, chartBlocks(charts));
    }

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

    if (facts.length) {
      await place(surface, writer, sprite, factBlocks(LABELS.funFacts, facts));
    }

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
          sprite
        );
      }

      await place(surface, writer, sprite, html);

      onProgress?.(
        Math.min(100, ((start + batch.length) / messages.length) * 100)
      );
      // Hand the thread back so the progress bar can actually repaint.
      await nextFrame();
    }

    await place(
      surface,
      writer,
      sprite,
      isSample
        ? outroBlock(LABELS.sampleOutroTitle, LABELS.site)
        : outroBlock(LABELS.outroTitle, LABELS.site)
    );

    onProgress?.(100);

    return writer.finish(
      `WhatsAnalyze — ${ego}`,
      (page, total) => `Page ${page} of ${total}`
    );
  } finally {
    surface.destroy();
  }
}

async function place(
  surface: LayoutSurface,
  writer: PdfWriter,
  sprite: Map<string, string>,
  html: string
): Promise<void> {
  if (!html) return;
  const elements = await surface.render(html);
  await writer.place(measureBlocks(surface, elements), sprite);
}
