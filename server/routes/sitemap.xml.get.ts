// @ts-expect-error — plain JS module shared with nuxt.config.js
import { indexablePages, localeCodes, siteBaseUrl } from "../../config/routes";

/**
 * /sitemap.xml used to fall through to the SPA shell, so search engines got an
 * HTML page where they asked for a sitemap. It is prerendered into dist at
 * build time from the same page list the prerenderer walks, so the two cannot
 * drift apart.
 *
 * Every page is listed once per locale, with the alternates cross-linked the
 * way `prefix_except_default` serves them: English at the root, the rest
 * behind their code. Each path ends in a slash because GitHub Pages serves the
 * prerendered `page/index.html` there and 301s the bare path — a sitemap of
 * redirects is one Search Console will not index.
 */
export default defineEventHandler((event) => {
  const pathFor = (locale: string, page: string) => {
    const prefix = locale === "en" ? "" : `/${locale}`;
    return `${siteBaseUrl}${prefix}/${page ? `${page}/` : ""}`;
  };

  const urls = indexablePages
    .flatMap((page) =>
      localeCodes.map((locale) => {
        const alternates = localeCodes
          .map(
            (alt) =>
              `    <xhtml:link rel="alternate" hreflang="${alt}" href="${pathFor(
                alt,
                page,
              )}"/>`,
          )
          .join("\n");
        return [
          "  <url>",
          `    <loc>${pathFor(locale, page)}</loc>`,
          alternates,
          "  </url>",
        ].join("\n");
      }),
    )
    .join("\n");

  setHeader(event, "content-type", "application/xml; charset=utf-8");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
});
