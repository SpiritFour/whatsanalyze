import { block, words } from "~/utils/pdf/html";
import { escapeHtml } from "~/utils/pdf/emoji";
import { CHAT_STYLES } from "~/utils/pdf/chatStyles";
import type { ChatViewOptions } from "~/utils/pdf/chatStyles";

/**
 * The pages around the chat in the WhatsApp-to-PDF export: a cover with the
 * logo and the chat's facts, and, on a preview, an outro that says what was
 * left out and where to get the rest.
 *
 * They are PDF-only: the on-screen preview and the browser printout are the
 * chat itself. All copy arrives translated from the page (pdfTool.cover.*,
 * pdfTool.outro.*), and every link is printed as readable text too, because a
 * printed page cannot be clicked.
 */

export interface PdfLink {
  url: string;
  /** What is printed: the address without its tracking parameters. */
  text: string;
}

export interface ChatCoverContent {
  brand: string;
  eyebrow: string;
  title: string;
  members: string;
  stats: Array<{ value: string; label: string }>;
  period: string;
  /** "Preview · first 100 messages"; empty for the full chat. */
  badge: string;
  footer: string;
  link: PdfLink;
}

export interface ChatOutroContent {
  title: string;
  /** "1,025" */
  missing: string;
  missingLabel: string;
  progress: string;
  /** Share of the chat in the preview, 0–1. */
  shownRatio: number;
  ctaTitle: string;
  ctaText: string;
  ctaLink: PdfLink;
  moreTitle: string;
  products: Array<{ title: string; text: string; link: PdfLink }>;
  privacy: string;
}

export const COVER_CHAPTER = "cover";
export const OUTRO_CHAPTER = "outro";

function link({ url, text }: PdfLink, className: string): string {
  return `<a class="${className}" href="${escapeHtml(url)}">${words(text)}</a>`;
}

export function chatCoverHtml(content: ChatCoverContent, logo: string): string {
  const stats = content.stats
    .map(
      (stat) =>
        `<div class="cp-stat"><div class="cp-stat-value">${words(
          stat.value,
        )}</div><div class="cp-stat-label">${words(stat.label)}</div></div>`,
    )
    .join("");

  return block(
    COVER_CHAPTER,
    `<div class="cp-cover">
       <div class="cp-brand">
         <img class="cp-logo" src="${logo}" data-format="PNG" alt="">
         <span class="cp-brand-name">${words(content.brand)}</span>
       </div>
       <div class="cp-cover-main">
         <div class="cp-eyebrow">${words(content.eyebrow)}</div>
         <div class="cp-title">${words(content.title)}</div>
         <div class="cp-members">${words(content.members)}</div>
         <div class="cp-period">${words(content.period)}</div>
         <div class="cp-stats">${stats}</div>
         ${
           content.badge
             ? `<div class="cp-badge-row"><span class="cp-badge">${words(
                 content.badge,
               )}</span></div>`
             : ""
         }
       </div>
       <div class="cp-cover-footer">
         <div>${words(content.footer)}</div>
         ${link(content.link, "cp-link")}
       </div>
     </div>`,
    { breakBefore: true },
  );
}

export function chatOutroHtml(content: ChatOutroContent, logo: string): string {
  const percent = Math.max(2, Math.min(100, content.shownRatio * 100));
  const products = content.products
    .map(
      (product) =>
        `<div class="cp-product">
           <div class="cp-product-title">${words(product.title)}</div>
           <div class="cp-product-text">${words(product.text)}</div>
           ${link(product.link, "cp-link cp-product-link")}
         </div>`,
    )
    .join("");

  return block(
    OUTRO_CHAPTER,
    `<div class="cp-outro">
       <div class="cp-brand">
         <img class="cp-logo" src="${logo}" data-format="PNG" alt="">
         <span class="cp-brand-name">${words("WhatsAnalyze")}</span>
       </div>
       <div class="cp-outro-title">${words(content.title)}</div>
       <div class="cp-missing">
         <div class="cp-missing-value">${words(content.missing)}</div>
         <div class="cp-missing-label">${words(content.missingLabel)}</div>
       </div>
       <div class="cp-bar"><div class="cp-bar-fill" style="width:${percent}%"></div></div>
       <div class="cp-progress">${words(content.progress)}</div>
       <div class="cp-cta">
         <div class="cp-cta-title">${words(content.ctaTitle)}</div>
         <div class="cp-cta-text">${words(content.ctaText)}</div>
         ${link(content.ctaLink, "cp-cta-link")}
       </div>
       <div class="cp-more-title">${words(content.moreTitle)}</div>
       <div class="cp-products">${products}</div>
       <div class="cp-privacy">${words(content.privacy)}</div>
     </div>`,
    { breakBefore: true },
  );
}

/** Brand teal: the logo's own colour, for the call to action. */
const BRAND = "#21a68d";

/**
 * Styles for both pages, in the chosen chat style's palette. `pageHeight` is
 * the printable height, so the cover can fill its sheet and push its footer
 * to the bottom.
 */
export function chatPagesCss(
  options: ChatViewOptions,
  pageHeight: number,
): string {
  const s = CHAT_STYLES[options.style];
  // The ink saver keeps to grays and spends no toner on a filled box; every
  // other style gets the brand colour.
  const ink = options.style === "ink";
  const accent = ink ? "#000000" : BRAND;
  const ctaBackground = ink ? "#eeeeee" : BRAND;
  const ctaText = ink ? "#000000" : "#ffffff";
  const ctaButton = ink ? "#000000" : "#ffffff";
  const ctaButtonText = ink ? "#ffffff" : BRAND;

  return `
.cp-cover, .cp-outro { color: ${s.text}; font-family: "WaPdf", Helvetica, Arial, sans-serif; }
.cp-cover {
  height: ${Math.floor(pageHeight)}px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.cp-brand { display: flex; align-items: center; gap: 12px; }
.cp-logo { width: 44px; height: 44px; border-radius: 10px; }
.cp-brand-name { font-size: 22px; font-weight: 700; color: ${s.text}; }

.cp-cover-main { padding-bottom: 40px; }
.cp-eyebrow { font-size: 14px; font-weight: 700; color: ${accent}; text-transform: uppercase; }
.cp-title { font-size: 40px; line-height: 1.15; font-weight: 700; padding-top: 10px; overflow-wrap: anywhere; }
.cp-members { font-size: 15px; color: ${s.muted}; padding-top: 12px; overflow-wrap: anywhere; }
.cp-period { font-size: 15px; color: ${s.muted}; padding-top: 4px; }
.cp-stats { display: flex; gap: 14px; padding-top: 34px; }
.cp-stat {
  flex: 1; background: ${s.header}; border-radius: 14px; padding: 16px 18px;
}
.cp-stat-value { font-size: 28px; font-weight: 700; color: ${s.headerText}; }
.cp-stat-label { font-size: 13px; color: ${s.headerMuted}; padding-top: 2px; }
.cp-badge-row { padding-top: 22px; }
.cp-badge {
  display: inline-block; background: ${accent}; color: #ffffff;
  font-size: 13px; font-weight: 700; border-radius: 999px; padding: 6px 14px;
}
.cp-cover-footer { font-size: 12px; color: ${s.muted}; line-height: 1.5; }
.cp-link { color: ${accent}; font-weight: 700; text-decoration: none; }

.cp-outro-title { font-size: 30px; font-weight: 700; padding-top: 34px; }
.cp-missing { display: flex; align-items: baseline; gap: 12px; padding-top: 18px; }
.cp-missing-value { font-size: 52px; font-weight: 700; color: ${accent}; }
.cp-missing-label { font-size: 17px; color: ${s.text}; }
.cp-bar { height: 10px; border-radius: 5px; background: ${s.header}; margin-top: 12px; }
.cp-bar-fill { height: 10px; border-radius: 5px; background: ${accent}; }
.cp-progress { font-size: 12px; color: ${s.muted}; padding-top: 6px; }

.cp-cta {
  margin-top: 30px; padding: 22px 24px; border-radius: 16px;
  background: ${ctaBackground}; color: ${ctaText};
}
.cp-cta-title { font-size: 22px; font-weight: 700; }
.cp-cta-text { font-size: 14px; line-height: 1.5; padding-top: 6px; }
.cp-cta-link {
  display: inline-block; margin-top: 14px; padding: 8px 16px; border-radius: 999px;
  background: ${ctaButton}; color: ${ctaButtonText}; font-size: 14px; font-weight: 700; text-decoration: none;
}

.cp-more-title { font-size: 18px; font-weight: 700; padding-top: 30px; }
.cp-products { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 12px; }
.cp-product { background: ${s.header}; border-radius: 14px; padding: 14px 16px; }
.cp-product-title { font-size: 15px; font-weight: 700; color: ${s.headerText}; }
.cp-product-text { font-size: 12.5px; line-height: 1.45; color: ${s.headerMuted}; padding-top: 4px; }
.cp-product-link { display: inline-block; font-size: 12px; padding-top: 8px; }
.cp-privacy { font-size: 12px; color: ${s.muted}; padding-top: 24px; }
`;
}
