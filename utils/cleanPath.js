/**
 * Strips locale prefixes (/de/, /es/, etc.), query parameters, and hashes,
 * ensuring a canonical path ending with a single trailing slash.
 * e.g. "/de/tools/word-counter/" -> "/tools/word-counter/"
 *      "/es/" -> "/"
 *
 * @param {string} [rawPath]
 * @returns {string}
 */
export function cleanPath(rawPath) {
  if (!rawPath) return "/";
  const path = rawPath.split("?")[0].split("#")[0].replace(/\/+/g, "/");
  const stripped = path.replace(/^\/(?:en|de|es|fr|pt|it)(?=\/|$)/, "");
  if (!stripped || stripped === "/") return "/";
  return stripped.endsWith("/") ? stripped : stripped + "/";
}

/**
 * Canonical content group for GA4 page views, events, and Stripe metadata.
 * Strips language prefixes so all locale views aggregate together.
 *
 * @param {string} [path]
 * @returns {string}
 */
export const contentGroupFor = cleanPath;
