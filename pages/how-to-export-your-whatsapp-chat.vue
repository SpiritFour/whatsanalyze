<template>
  <div>
    <LandingHero
      :breadcrumbs="breadcrumbs"
      :title="title"
      :subtitle="page?.description || ''"
      :cta-text="t('exportGuidePage.heroCta')"
      cta-to="#dropzone-slot"
      :note="checkedNote"
      @click="trackHeroCta"
    />

    <LandingSection theme="light" :title="t('exportGuidePage.phoneTitle')">
      <!-- No `to`: its button scrolls down to the upload box below instead
           of sending the reader off to the home page. -->
      <ExportExplainer
        class="export-guide__explainer"
        cta="exportGuidePage.explainerCta"
      />
      <p class="export-guide__computer">
        <a href="#computer">{{ t("exportGuidePage.computerLink") }} ↓</a>
      </p>
    </LandingSection>

    <!-- Everyone reading this is about to have a chat file, so the next step
         is right here rather than on another page. The chat is handed on
         through shared state: whichever card they pick opens it without
         asking for the file again. -->
    <LandingSection
      theme="white"
      :eyebrow="t('exportGuidePage.nextEyebrow')"
      :title="t('exportGuidePage.nextTitle')"
      :text="t('exportGuidePage.nextText')"
    >
      <div id="dropzone-slot" class="export-guide__dropzone">
        <ToolDropzone tool-type="export_guide" @analyzed="chatReady = true" />
      </div>
      <LandingCards
        class="export-guide__cards"
        :items="nextSteps"
        @select="trackNextStep"
      />
    </LandingSection>

    <Content :page="page" />

    <v-container class="export-guide__extras">
      <PdfExample />
      <div class="comparison-section my-5">
        <h2>Comparison of different tools available</h2>
        <p>
          Comparison of different tools available for exporting a WhatsApp chat
          and creating a PDF
        </p>
      </div>
      <v-data-table
        class="styled-table"
        hide-default-footer
        disable-sort
        :headers="headers"
        :items="desserts"
      ></v-data-table>
    </v-container>

    <LandingCta
      :title="t('exportGuidePage.ctaTitle')"
      :cta-text="t('exportGuidePage.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('exportGuidePage.ctaNote')"
      @click="trackBottomCta"
    />
  </div>
</template>

<script>
import { ONE_TIME_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import { scrollToDropzone } from "~/composables/useToolPage";

const GUIDE_PATH = "/how-to-export-your-whatsapp-chat";

// The day the steps were last checked against WhatsApp's own help page
// (faq.whatsapp.com/1180414079177245). It is printed under the title and is
// the article's dateModified, so only move it after checking them again.
const STEPS_CHECKED = "2026-11-03";

export default {
  name: "HowToExportYourWhatsappChat",
  components: { ToolDropzone },
  async setup() {
    const { t, locale, localeProperties } = useI18n();
    const localePath = useLocalePath();
    const { baseUrl } = useRuntimeConfig().public;

    // One copy of the guide per language, under content/<locale>/ like the
    // routes, English at the root. A language without its own copy shows the
    // English one rather than nothing.
    //
    // Awaited only at the end of setup: this is not <script setup>, so
    // nothing restores the Nuxt instance after an await, and useSeoMeta and
    // useHead below need it (NUXT_E1001 otherwise).
    const content = useAsyncData(
      `content-export-guide-${locale.value}`,
      async () => {
        const path =
          locale.value === "en" ? GUIDE_PATH : `/${locale.value}${GUIDE_PATH}`;
        return (
          (await queryCollection("pages").path(path).first()) ??
          queryCollection("pages").path(GUIDE_PATH).first()
        );
      },
    );
    const page = content.data;

    const title = computed(
      () => page.value?.title || t("seo.exportGuideTitle"),
    );
    const homeUrl = `${baseUrl}${localePath("/")}`;
    const pageUrl = `${baseUrl}${localePath(GUIDE_PATH)}`;

    useSeoMeta({
      title: () => t("seo.exportGuideTitle"),
      description: () => t("seo.exportGuideDescription"),
      ogTitle: () => t("seo.exportGuideTitle"),
      ogSiteName: "WhatsAnalyze",
      ogDescription: () => t("seo.exportGuideDescription"),
      ogUrl: pageUrl,
    });

    // Only what Google still shows for a page like this: the breadcrumb
    // trail, and the article's title and date. HowTo and FAQ rich results no
    // longer appear at all (FAQ since May 2026), so the steps are not marked
    // up as either.
    useHead(() => ({
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "WhatsAnalyze",
                    item: homeUrl,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: title.value,
                    item: pageUrl,
                  },
                ],
              },
              {
                "@type": "Article",
                headline: title.value,
                description: t("seo.exportGuideDescription"),
                inLanguage: localeProperties.value.language,
                dateModified: `${STEPS_CHECKED}T00:00:00Z`,
                author: {
                  "@type": "Organization",
                  name: "WhatsAnalyze",
                  url: `${baseUrl}/`,
                },
                mainEntityOfPage: pageUrl,
              },
            ],
          }),
        },
      ],
    }));

    const checkedNote = computed(() =>
      t("exportGuidePage.checkedNote", {
        // UTC on both ends, or a reader west of Greenwich is told the day
        // before.
        date: new Intl.DateTimeFormat(localeProperties.value.language, {
          dateStyle: "long",
          timeZone: "UTC",
        }).format(new Date(`${STEPS_CHECKED}T00:00:00Z`)),
      }),
    );

    // Set once the dropzone holds a chat, dropped here or restored from
    // earlier in this tab. The cards then lead straight into that chat.
    const chatReady = ref(false);
    const nextSteps = computed(() => {
      const linkText = chatReady.value
        ? t("exportGuidePage.cardContinue")
        : t("exportGuidePage.cardOpen");
      return [
        {
          cta: "full_analyzer",
          icon: "mdi-chart-box-outline",
          title: t("exportGuidePage.cardStatsTitle"),
          text: t("exportGuidePage.cardStatsText"),
          to: localePath(
            chatReady.value ? { path: "/", hash: "#results" } : "/",
          ),
          linkText,
        },
        {
          cta: "ai",
          icon: "mdi-creation-outline",
          title: t("exportGuidePage.cardAiTitle"),
          text: t("exportGuidePage.cardAiText"),
          to: localePath("/tools/ai-chat-analyzer"),
          linkText,
        },
        {
          cta: "pdf",
          icon: "mdi-file-document-outline",
          title: t("exportGuidePage.cardPdfTitle"),
          text: t("exportGuidePage.cardPdfText", {
            price: formatPrice(ONE_TIME_PRICE, locale.value),
          }),
          // The download sits under the analysis on the home page.
          to: localePath(
            chatReady.value ? { path: "/", hash: "#payButton" } : "/",
          ),
          linkText,
        },
        {
          cta: "court_pdf",
          icon: "mdi-scale-balance",
          title: t("exportGuidePage.cardCourtTitle"),
          text: t("exportGuidePage.cardCourtText"),
          to: localePath("/tools/court-evidence"),
          linkText,
        },
      ];
    });

    const breadcrumbs = computed(() => [
      { label: "WhatsAnalyze", to: localePath("/") },
      { label: title.value },
    ]);

    await content;

    return {
      t,
      page,
      title,
      breadcrumbs,
      checkedNote,
      chatReady,
      nextSteps,
      trackHeroCta: () =>
        analyticsTools.ctaClick("export_guide", "hero_dropzone"),
      trackNextStep: (item) =>
        analyticsTools.ctaClick("export_guide", item.cta),
      trackBottomCta: () => {
        scrollToDropzone();
        analyticsTools.ctaClick("export_guide", "scroll_to_dropzone");
      },
    };
  },
  data() {
    return {
      headers: [
        {
          title: "Features & Solutions of PDF export tools",
          align: "start",
          sortable: false,
          key: "name",
        },
        { title: "Zapptales", key: "zapptales" },
        { title: "Dr. Fon", key: "drfon" },
        { title: "Longshot app", key: "longshotapp" },
        { title: "Export to txt and then to PDF", key: "pdfex" },
        {
          title: "WhatsAnalyze",
          key: "whatsAnalyze",
        },
      ],
      desserts: [
        // Privacy comparison
        {
          name: "Privacy 🛡️",
          zapptales: "🔴 Limited user control",
          whatsAnalyze:
            "🟢 Superior: Complete privacy with on-device processing",
          drfon: "🔴 Limited user control",
          longshotapp: "🟡 Basic privacy",
          pdfex: "🟡 Basic privacy",
        },
        // Security comparison
        {
          name: "Security 🔒",
          zapptales: "🔴 Potential server storage risks",
          whatsAnalyze: "🟢 Top-notch: All operations are local and secure",
          drfon: "🔴 Potential server storage risks",
          longshotapp: "🔴 Not open source, security unclear",
          pdfex: "🟡 Generally secure",
        },
        // Effort comparison
        {
          name: "Effort 🛠️",
          zapptales: "🔴 High: Requires desktop app and multiple steps",
          whatsAnalyze: "🟢 Minimal: Quick and straightforward on your phone",
          drfon: "🔴 High: Requires desktop app",
          longshotapp: "🟡 Medium: On phone but requires external app",
          pdfex: "🔴 High effort required",
        },
        // User can Print comparison
        {
          name: "User can Print 🖨️",
          zapptales: "🟡 Printable",
          whatsAnalyze:
            "🟢 Optimized for Printing: Perfect for books or booklets",
          drfon: "🟡 Printable",
          longshotapp: "🔴 Not printable",
          pdfex: "🟡 Printable",
        },
        // Analytics comparison
        {
          name: "Analytics 📊",
          zapptales: "🔴 No additional features",
          whatsAnalyze:
            "🟢 Comprehensive: Includes fun facts and detailed analysis",
          drfon: "🔴 No additional features",
          longshotapp: "🔴 No additional features",
          pdfex: "🔴 No additional features",
        },
        // iOS compatibility
        {
          name: "iOS Compatibility 📱",
          zapptales: "🟡 Compatible with iPhone",
          whatsAnalyze: "🟢 Fully optimized for iPhone",
          drfon: "🟡 Compatible with iPhone",
          longshotapp: "🔴 Android only",
          pdfex: "🔴 Complicated, requires external app",
        },
        // Android compatibility
        {
          name: "Android Compatibility 📱",
          zapptales: "🟡 Works with complications",
          whatsAnalyze: "🟢 Seamless experience on Android devices",
          drfon: "🟡 Works with complications",
          longshotapp: "🟢 Fully compatible",
          pdfex: "🔴 Requires external app",
        },
        // Free Preview comparison
        {
          name: "Free Preview 🔍",
          zapptales: "🔴 No preview available",
          whatsAnalyze: "🟢 Exclusive: Free preview with complete statistics",
          drfon: "🔴 No preview, subscription trial",
          longshotapp: "🔴 No trial available",
          pdfex: "🔴 Long and complicated process",
        },
        // Price comparison
        {
          name: "Price 💲",
          zapptales: "🔴 Expensive",
          whatsAnalyze: "🟢 Most affordable, best value",
          drfon: "🔴 Expensive",
          longshotapp: "🟡 In-app purchases",
          pdfex: "🟡 Free, but with ads",
        },
        // Rating comparison
        {
          name: "Rating ⭐",
          zapptales: "🟡 Good",
          whatsAnalyze:
            "🟢 Excellent: Highest rating for security, affordability, and analytics",
          drfon: "🟡 Good",
          longshotapp: "🟡 Average",
          pdfex: "🟡 Average",
        },
      ],
    };
  },
};
</script>
<style lang="scss" scoped>
.export-guide__computer {
  margin-top: 2rem;

  a {
    color: $c-blue-accent-dark;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.export-guide__explainer,
.export-guide__dropzone {
  margin-top: clamp(2rem, 5vw, 3rem);
}

// Four cards: two by two, or all four in a row on a wide screen, rather than
// the three and a stray one that auto-fit makes of them.
.export-guide__cards.landing-cards {
  @media (min-width: 600px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1000px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

// The table used to end on the old CTA's margin; the dark section now
// follows it directly.
.export-guide__extras {
  padding-bottom: clamp(2.5rem, 6vw, 4rem);
}
</style>

<style>
.styled-table {
  width: 100%;
  border-collapse: collapse;
}

.styled-table thead {
  background-color: #f4f4f4;
  color: #333;
  font-weight: bold;
}

.styled-table tbody tr:nth-child(odd) {
  background-color: #f9f9f9;
}

.styled-table tbody tr:hover {
  background-color: #f1f1f1;
}

.styled-table th,
.styled-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

@media (max-width: 600px) {
  .styled-table thead {
    display: none;
  }
  .styled-table,
  .styled-table tbody,
  .styled-table th,
  .styled-table td,
  .styled-table tr {
    display: block;
  }
  .styled-table td {
    position: relative;
    padding-left: 50%;
  }
  .styled-table td::before {
    position: absolute;
    top: 0;
    left: 6px;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    content: attr(data-label);
  }
}
</style>
