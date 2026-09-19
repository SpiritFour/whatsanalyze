/**
 * The one list of pages the site ships, shared by the Nitro prerenderer and by
 * the sitemap route so the two can never disagree about what exists.
 */
export const siteBaseUrl = (
  process.env.BASE_URL || "https://www.whatsanalyze.com"
).replace("http:", "https:");

export const defaultLocale = "en";

export const localeCodes = ["en", "de", "es", "fr", "pt", "it"];

/** Every page, as a path relative to the locale root. "" is the home page. */
export const localizedPages = [
  "",
  "about",
  "how-to-export-your-whatsapp-chat",
  "impressum",
  "pwa-results",
  "subscribe",
  "switch-from-whatsapp-to-signal",
  "tools",
  "tools/court-evidence",
  "tools/inactivity",
  "tools/proof-of-relationship",
  "tools/message-counter",
  "tools/word-counter",
  "tools/chat-heatmap",
  "whatsapp-to-pdf",
  "wrapped",
  "wrapped/results",
  "wrapped/subscription/verify",
  "wrapped/subscription/success",
  "wrapped/subscription/canceled",
];

/**
 * What belongs in the sitemap: the pages a search engine should land someone
 * on. The payment callbacks and the results view only mean anything with state
 * the visitor brought with them.
 */
const notIndexable = new Set([
  "pwa-results",
  "wrapped/results",
  "wrapped/subscription/verify",
  "wrapped/subscription/success",
  "wrapped/subscription/canceled",
]);

export const indexablePages = localizedPages.filter(
  (page) => !notIndexable.has(page)
);
