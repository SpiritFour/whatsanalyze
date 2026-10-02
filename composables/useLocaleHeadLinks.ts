import { useLocaleHead } from "#i18n";

/**
 * The canonical and hreflang links from useLocaleHead, with a trailing slash.
 *
 * GitHub Pages serves each prerendered `page/index.html` at `page/` and 301s
 * the bare `page`, which is the form i18n writes. So every canonical pointed
 * at a redirect, Google filed the sitemap's `page/` URLs under "Alternate
 * page with proper canonical tag", and the hreflang alternates all redirected.
 */
export function useLocaleHeadLinks() {
  const localeHead = useLocaleHead();
  const links = computed(() =>
    (localeHead.value.link || []).map((link) => ({
      ...link,
      href: link.href?.endsWith("/") ? link.href : `${link.href}/`,
    })),
  );
  return { localeHead, links };
}
