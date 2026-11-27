import { chatFontFamily } from "~/utils/pdf/chatFonts";
import {
  contrast,
  isDark,
  mix,
  mutedOn,
  resolveStyle,
  textOn,
} from "~/utils/pdf/chatDesign";
import { block, words } from "~/utils/pdf/html";
import { escapeHtml } from "~/utils/pdf/emoji";
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
  /** A line or two under the title, set by the buyer (Pro). */
  dedication?: string;
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

/**
 * The cover title's size: large for a name, smaller step by step for a
 * group's list of members, so a long title takes two lines rather than five.
 */
export function titleSize(title: string): number {
  const length = Array.from(title).length;
  if (length <= 24) return 40;
  if (length <= 40) return 32;
  if (length <= 64) return 26;
  return 22;
}

export const COVER_CHAPTER = "cover";
export const OUTRO_CHAPTER = "outro";

function link({ url, text }: PdfLink, className: string): string {
  return `<a class="${className}" href="${escapeHtml(url)}">${words(text)}</a>`;
}

export function chatCoverHtml(
  content: ChatCoverContent,
  logo: string,
  photo: string | null = null,
): string {
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
       ${
         photo
           ? `<div class="cp-photo"><img src="${photo}" data-format="JPEG" alt=""></div>`
           : ""
       }
       <div class="cp-cover-main">
         <div class="cp-eyebrow">${words(content.eyebrow)}</div>
         <div class="cp-title" style="font-size:${titleSize(content.title)}px">${words(
           content.title,
         )}</div>
         ${
           content.dedication?.trim()
             ? `<div class="cp-dedication">${words(content.dedication.trim())}</div>`
             : ""
         }
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

/** An accent that stays readable on `background`, or its text colour. */
function readableAccent(accent: string, background: string): string {
  return contrast(accent, background) >= 3 ? accent : textOn(background);
}

/**
 * Styles for both pages, in the chosen design. Every text colour is picked
 * against the background it actually sits on: the cover may have its own
 * colour, and a custom page colour may be anything. `pageHeight` is the
 * printable height, so the cover can fill its sheet and push its footer to
 * the bottom.
 */
export function chatPagesCss(
  options: ChatViewOptions,
  pageHeight: number,
): string {
  const s = resolveStyle(options);
  // The ink saver keeps to grays and spends no toner on a filled box; a
  // custom style uses its own accent; the presets get the brand colour.
  const ink = options.style === "ink";
  const brand = ink ? "#000000" : (s.accent ?? BRAND);

  const cover = coverColor(options);
  const coverText = textOn(cover);
  const coverCard = mix(cover, coverText, isDark(cover) ? 0.14 : 0.08);
  const coverAccent = readableAccent(brand, cover);

  const page = s.page;
  const pageText = textOn(page);
  const pageMuted = mutedOn(page);
  const card = mix(page, pageText, isDark(page) ? 0.14 : 0.08);
  const accent = readableAccent(brand, page);
  const ctaBackground = ink ? "#eeeeee" : brand;
  const ctaText = textOn(ctaBackground);
  const ctaButton = ink
    ? "#000000"
    : textOn(brand) === "#111b21"
      ? "#111b21"
      : "#ffffff";
  const ctaButtonText = textOn(ctaButton);

  return `
.cp-cover, .cp-outro { font-family: ${chatFontFamily(options.font)}; }
.cp-cover {
  height: ${Math.floor(pageHeight)}px; color: ${coverText};
  display: flex; flex-direction: column; justify-content: space-between;
}
.cp-outro { color: ${pageText}; }
.cp-brand { display: flex; align-items: center; gap: 12px; }
.cp-logo { width: 44px; height: 44px; border-radius: 10px; }
.cp-brand-name { font-size: 22px; font-weight: 700; }

.cp-photo { display: flex; justify-content: center; padding: 18px 0 6px; }
.cp-photo img { display: block; max-width: 100%; max-height: 320px; border-radius: 16px; }

.cp-cover-main { padding-bottom: 40px; }
.cp-eyebrow { font-size: 14px; font-weight: 700; color: ${coverAccent}; text-transform: uppercase; }
.cp-title { font-size: 40px; line-height: 1.15; font-weight: 700; padding-top: 10px; overflow-wrap: anywhere; }
.cp-dedication { font-size: 19px; line-height: 1.45; padding-top: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
.cp-members { font-size: 15px; color: ${mutedOn(cover)}; padding-top: 12px; overflow-wrap: anywhere; }
.cp-period { font-size: 15px; color: ${mutedOn(cover)}; padding-top: 4px; }
.cp-stats { display: flex; gap: 14px; padding-top: 30px; }
.cp-stat { flex: 1; background: ${coverCard}; border-radius: 14px; padding: 16px 18px; }
.cp-stat-value { font-size: 28px; font-weight: 700; color: ${textOn(coverCard)}; }
.cp-stat-label { font-size: 13px; color: ${mutedOn(coverCard)}; padding-top: 2px; }
.cp-badge-row { padding-top: 22px; }
.cp-badge {
  display: inline-block; background: ${coverAccent}; color: ${textOn(coverAccent)};
  font-size: 13px; font-weight: 700; border-radius: 999px; padding: 6px 14px;
}
.cp-cover-footer { font-size: 12px; color: ${mutedOn(cover)}; line-height: 1.5; }
.cp-cover-footer .cp-link { color: ${coverAccent}; }
.cp-link { color: ${accent}; font-weight: 700; text-decoration: none; }

.cp-outro-title { font-size: 30px; font-weight: 700; padding-top: 34px; }
.cp-missing { display: flex; align-items: baseline; gap: 12px; padding-top: 18px; }
.cp-missing-value { font-size: 52px; font-weight: 700; color: ${accent}; }
.cp-missing-label { font-size: 17px; }
.cp-bar { height: 10px; border-radius: 5px; background: ${card}; margin-top: 12px; }
.cp-bar-fill { height: 10px; border-radius: 5px; background: ${accent}; }
.cp-progress { font-size: 12px; color: ${pageMuted}; padding-top: 6px; }

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
.cp-product { background: ${card}; border-radius: 14px; padding: 14px 16px; }
.cp-product-title { font-size: 15px; font-weight: 700; color: ${textOn(card)}; }
.cp-product-text { font-size: 12.5px; line-height: 1.45; color: ${mutedOn(card)}; padding-top: 4px; }
.cp-product .cp-link { color: ${readableAccent(brand, card)}; }
.cp-product-link { display: inline-block; font-size: 12px; padding-top: 8px; }
.cp-privacy { font-size: 12px; color: ${pageMuted}; padding-top: 24px; }
`;
}

/** The cover's background: the buyer's colour, or the style's page. */
export function coverColor(options: ChatViewOptions): string {
  const chosen = options.cover?.color;
  return chosen && /^#[0-9a-f]{6}$/i.test(chosen)
    ? chosen
    : resolveStyle(options).page;
}
