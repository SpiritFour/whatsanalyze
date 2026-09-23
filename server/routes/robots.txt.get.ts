// @ts-expect-error — plain JS module shared with nuxt.config.js
import { siteBaseUrl } from "../../config/routes";

/** Prerendered next to /sitemap.xml so crawlers find it without Search Console. */
export default defineEventHandler((event) => {
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  return `User-agent: *
Allow: /

Sitemap: ${siteBaseUrl}/sitemap.xml
`;
});
