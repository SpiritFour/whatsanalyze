import { computed } from "vue";
import type { ComputedRef } from "vue";
import { CURRENCY } from "~/utils/pricing";

/**
 * The parts every /tools page repeats.
 *
 * All six pages built their own breadcrumb trail, their own scroll-to-upload
 * handler and their own copy of the same structured-data blob — six places to
 * edit for one change, which is how four of them came to advertise prices in
 * USD on a site that only charges EUR.
 */

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * The trail above a tool's title. The last crumb comes from the shared tool
 * catalogue (composables/useSiteNav.ts), so a tool is named the same here, in
 * the header dropdown, on the /tools index and in the footer.
 */
export function useToolBreadcrumbs(toolTitleKey: string) {
  const { t } = useI18n();
  const localePath = useLocalePath();

  return computed(() => [
    { label: "WhatsAnalyze", to: localePath("/") },
    { label: t("toolsHub.headerTools"), to: localePath("/tools") },
    { label: t(toolTitleKey) },
  ]);
}

/**
 * Bring the visitor to the upload box. Every "try it" CTA on a tool page
 * scrolls rather than navigates — the dropzone is further down the same page.
 */
export function scrollToDropzone() {
  document
    .getElementById("dropzone-slot")
    ?.scrollIntoView({ behavior: "smooth" });
}

/**
 * The page's structured data.
 *
 * `app` describes a tool a visitor can use for free and is left off the
 * landing pages that sell the paid export — those are only an FAQ.
 */
export function useToolSchema(options: {
  faqItems: ComputedRef<FaqItem[]>;
  app?: { nameKey: string; descriptionKey: string };
}) {
  const { t } = useI18n();

  useHead(() => {
    const faqPage = {
      "@type": "FAQPage",
      mainEntity: options.faqItems.value.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    };

    const graph = options.app
      ? [
          {
            "@type": "SoftwareApplication",
            name: t(options.app.nameKey),
            operatingSystem: "All (Web-based)",
            applicationCategory: "UtilitiesApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: CURRENCY,
            },
            description: t(options.app.descriptionKey),
          },
          faqPage,
        ]
      : [faqPage];

    return {
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(
            graph.length === 1
              ? { "@context": "https://schema.org", ...graph[0] }
              : { "@context": "https://schema.org", "@graph": graph }
          ),
        },
      ],
    };
  });
}
