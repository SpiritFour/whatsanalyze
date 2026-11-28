import type { PdfLink } from "~/utils/pdf/chatPages";
import type { ChatCoverContent, ChatOutroContent } from "~/utils/pdf/chatPages";
import type { ChatViewLabels } from "~/utils/pdf/chatView";
import type { ChatAnalysisLabels } from "~/utils/pdf/chatAnalysis";
import type { ChatViewOptions } from "~/utils/pdf/chatStyles";
import { chatDurationInDays } from "~/utils/utils";

/**
 * The words of the styled chat PDF: its subtitle, cover, outro and analysis
 * pages. Shared by the WhatsApp to PDF tool and the analyzer's download, so
 * both print the same document.
 */

export interface PdfLabelContext {
  t: (_key: string, _params?: Record<string, unknown>) => string;
  locale: string;
  /** A link printed in the PDF (with campaign parameters when clicked). */
  link: (_path: string, _campaign: string) => PdfLink;
  /** The one-time price, formatted for the locale. */
  price: string;
}

export interface PdfChatFacts {
  participants: string[];
  /** The chat's title: the other person, or the group's members. */
  title: string;
  /** The messages after the content filters: what the document shows. */
  messages: Array<{ date: Date | string }>;
}

/** The other person in a one-on-one chat, or the group's members. */
export function chatTitleFor(participants: string[], me: string): string {
  const others = participants.filter((name) => name !== me);
  if (others.length === 0) return me || "WhatsApp";
  if (others.length === 1) return others[0];
  const shown = others.slice(0, 3).join(", ");
  return others.length > 3 ? `${shown} +${others.length - 3}` : shown;
}

export function formatDay(locale: string, date: Date | string | undefined) {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(date),
    );
  } catch {
    return "";
  }
}

const counter = (locale: string) => (value: number) =>
  Number(value).toLocaleString(locale);

export function chatCoverContent(
  ctx: PdfLabelContext,
  chat: PdfChatFacts,
  printed: number,
  total: number,
  design: ChatViewOptions,
): ChatCoverContent {
  const { t, locale } = ctx;
  const count = counter(locale);
  const first = chat.messages[0]?.date;
  const last = chat.messages.at(-1)?.date;
  const people = chat.participants;
  const members =
    people.length > 12
      ? `${people.slice(0, 12).join(", ")} +${people.length - 12}`
      : people.join(", ");
  return {
    brand: "WhatsAnalyze",
    eyebrow: t("pdfTool.cover.eyebrow"),
    title: design.cover?.title?.trim() || chat.title,
    dedication: design.cover?.dedication || "",
    members,
    period: `${formatDay(locale, first)} – ${formatDay(locale, last)}`,
    stats: [
      { value: count(total), label: t("pdfTool.cover.messages") },
      {
        value: count(chatDurationInDays(first, last)),
        label: t("pdfTool.cover.days"),
      },
      { value: count(people.length), label: t("pdfTool.cover.people") },
    ],
    badge:
      printed < total
        ? t("pdfTool.cover.badge", { count: count(printed) })
        : "",
    footer: t("pdfTool.cover.footer"),
    link: ctx.link("/tools/whatsapp-to-pdf", "cover"),
  };
}

/** The last page of a preview: what is missing, and where to get it. */
export function chatOutroContent(
  ctx: PdfLabelContext,
  printed: number,
  total: number,
): ChatOutroContent | null {
  if (printed >= total) return null;
  const { t } = ctx;
  const count = counter(ctx.locale);
  const product = (key: string, path: string) => ({
    title: t(`pdfTool.outro.${key}Title`),
    text: t(`pdfTool.outro.${key}Text`),
    link: ctx.link(path, "preview_outro"),
  });
  return {
    title: t("pdfTool.outro.title"),
    missing: count(total - printed),
    missingLabel: t("pdfTool.outro.missingLabel"),
    progress: t("pdfTool.outro.progress", {
      shown: count(printed),
      total: count(total),
    }),
    shownRatio: printed / total,
    ctaTitle: t("pdfTool.outro.ctaTitle"),
    ctaText: t("pdfTool.outro.ctaText", { price: ctx.price }),
    ctaLink: ctx.link("/tools/whatsapp-to-pdf", "preview_outro"),
    moreTitle: t("pdfTool.outro.moreTitle"),
    products: [
      product("analysis", "/"),
      product("ai", "/tools/ai-chat-analyzer"),
      product("court", "/tools/court-evidence"),
      product("wrapped", "/wrapped"),
    ],
    privacy: t("pdfTool.outro.privacy"),
  };
}

export function chatAnalysisLabels(ctx: PdfLabelContext): ChatAnalysisLabels {
  const a = (key: string) => ctx.t(`pdfTool.analysis.${key}`);
  return {
    title: a("title"),
    perDay: a("perDay"),
    busiestDay: a("busiestDay"),
    busiestHour: a("busiestHour"),
    perPerson: a("perPerson"),
    timeline: a("timeline"),
    timeOfDay: a("timeOfDay"),
    weekdays: a("weekdays"),
    funFacts: a("funFacts"),
    words: a("words"),
    wordsPerMessage: a("wordsPerMessage"),
    uniqueWords: a("uniqueWords"),
    longestMessage: a("longestMessage"),
    messages: ctx.t("pdfTool.cover.messages"),
    others: a("others"),
  };
}

/** Labels for a document that prints `printed` of the chat's messages. */
export function chatPdfLabels(
  ctx: PdfLabelContext,
  chat: PdfChatFacts,
  design: ChatViewOptions,
  printed: number,
  total: number,
): ChatViewLabels {
  const { t, locale } = ctx;
  const count = counter(locale);
  return {
    subtitle: t("pdfTool.subtitle", {
      count: count(total),
      from: formatDay(locale, chat.messages[0]?.date),
      to: formatDay(locale, chat.messages.at(-1)?.date),
    }),
    notice:
      printed < total
        ? t("pdfTool.previewNotice", {
            shown: count(printed),
            total: count(total),
          })
        : "",
    cover: chatCoverContent(ctx, chat, printed, total, design),
    outro: chatOutroContent(ctx, printed, total),
    analysis: chatAnalysisLabels(ctx),
  };
}
