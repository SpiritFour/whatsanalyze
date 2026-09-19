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

/**
 * Pages that used to ship here and now live somewhere else, as a path relative
 * to the locale root.
 *
 * These cannot be left to `firebase.json`. The live site is deployed to
 * GitHub Pages by `deployment-live.yml`, and GitHub Pages reads none of
 * Firebase Hosting's redirect rules — so a redirect written only there works
 * on the dev project and 404s in production. Prerendering each one as a
 * redirect stub is the only form that works on both.
 */
export const retiredPages = {
  "whatsapp-wrapped-year-review": "wrapped",
};

/** Every retired path, per locale, mapped to its destination. */
export const retiredRedirects = Object.fromEntries(
  localeCodes.flatMap((locale) => {
    const prefix = locale === defaultLocale ? "" : `/${locale}`;
    return Object.entries(retiredPages).map(([from, to]) => [
      `${prefix}/${from}`,
      `${prefix}/${to}`,
    ]);
  })
);
