<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :title="t('pdfPage.heroTitle')"
      :subtitle="t('pdfPage.heroSubtitle')"
      :cta-text="t('pdfPage.heroCta')"
      cta-to="#dropzone-slot"
      :note="t('pdfPage.heroNote', { price })"
      @click="trackHeroCta"
    >
      <!-- Pages of a PDF this site made, rather than a description of one. -->
      <img
        :src="pdfExampleImage"
        :alt="t('pdfPage.exampleAlt')"
        width="2430"
        height="1132"
        class="pdf-example"
      />
    </LandingHero>

    <!-- The tool itself: upload, pick a look, preview, print or download.
         The chat-with-charts PDF is still made under the analysis on the
         home page. -->
    <ChatPdfTool
      :title="t('pdfPage.uploadTitle')"
      :text="t('pdfPage.uploadText')"
      checkout-source="whatsapp_to_pdf"
    />
    <div class="pdf-page__links">
      <NuxtLink :to="localePath('/how-to-export-your-whatsapp-chat')">
        {{ t("pdfPage.guideLink") }} →
      </NuxtLink>
      <NuxtLink :to="analysisPath" @click="trackAnalysis">
        {{ t("pdfPage.analysisLink") }} →
      </NuxtLink>
    </div>

    <LandingSection
      theme="light"
      :eyebrow="t('pdfPage.contentsEyebrow')"
      :title="t('pdfPage.contentsTitle')"
    >
      <LandingCards :items="contents" />
    </LandingSection>

    <LandingSection theme="white" :title="t('pdfPage.stepsTitle')">
      <LandingSteps :steps="steps" />
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('pdfPage.courtEyebrow')"
      :title="t('pdfPage.courtTitle')"
      :text="t('pdfPage.courtText')"
    >
      <div class="pdf-page__next">
        <LandingButton
          :to="localePath('/tools/court-evidence')"
          @click="trackCourt"
        >
          {{ t("pdfPage.courtButton") }}
        </LandingButton>
      </div>
    </LandingSection>

    <LandingSection theme="light" :title="t('pdfPage.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('pdfPage.ctaTitle')"
      :cta-text="t('pdfPage.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('pdfPage.ctaNote')"
      @click="trackBottomCta"
    />
  </div>
</template>

<script>
import { ONE_TIME_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";
import ChatPdfTool from "~/components/tools/ChatPdfTool.vue";
import {
  scrollToDropzone,
  useBreadcrumbSchema,
} from "~/composables/useToolPage";
import pdfExampleImage from "~/assets/img/whatsapp export pdf.png";

export default {
  components: { ChatPdfTool },
  setup() {
    const { t, locale } = useI18n();
    const localePath = useLocalePath();
    const { baseUrl } = useRuntimeConfig().public;
    const price = computed(() => formatPrice(ONE_TIME_PRICE, locale.value));
    const pageUrl = `${baseUrl}${localePath("/whatsapp-to-pdf")}`;

    useSeoMeta({
      title: () => t("seo.pdfGuideTitle"),
      description: () => t("seo.pdfGuideDescription"),
      ogTitle: () => t("seo.pdfGuideTitle"),
      ogSiteName: "WhatsAnalyze",
      ogDescription: () => t("seo.pdfGuideDescription"),
      ogUrl: pageUrl,
    });

    // No FAQPage markup for the questions below: Google stopped showing FAQ
    // results in May 2026. The breadcrumb trail is still shown.
    useBreadcrumbSchema(
      computed(() => [
        { name: "WhatsAnalyze", url: `${baseUrl}${localePath("/")}` },
        { name: t("pdfPage.navLabel"), url: pageUrl },
      ]),
    );

    const contents = computed(() =>
      [1, 2, 3].map((i) => ({
        icon: [
          "mdi-message-text-outline",
          "mdi-chart-box-outline",
          "mdi-emoticon-happy-outline",
        ][i - 1],
        title: t(`pdfPage.card${i}Title`),
        text: t(`pdfPage.card${i}Text`),
      })),
    );

    const steps = computed(() =>
      [1, 2, 3].map((i) => ({
        title: t(`pdfPage.step${i}Title`),
        text: t(`pdfPage.step${i}Text`, { price: price.value }),
      })),
    );

    const faq = computed(() =>
      [1, 2, 3, 4, 5].map((i) => ({
        q: t(`pdfPage.faq${i}Q`),
        a: t(`pdfPage.faq${i}A`, { price: price.value }),
      })),
    );

    // The PDF with charts sits under the analysis on the home page, which
    // picks the parsed chat up from shared state.
    const analysisPath = computed(() =>
      localePath({ path: "/", hash: "#payButton" }),
    );

    return {
      t,
      localePath,
      price,
      pdfExampleImage,
      breadcrumbs: computed(() => [
        { label: "WhatsAnalyze", to: localePath("/") },
        { label: t("pdfPage.navLabel") },
      ]),
      contents,
      steps,
      faq,
      analysisPath,
      trackHeroCta: () => analyticsTools.ctaClick("pdf", "hero_dropzone"),
      trackAnalysis: () => analyticsTools.ctaClick("pdf", "full_analyzer"),
      trackCourt: () => analyticsTools.ctaClick("pdf", "court_pdf"),
      trackBottomCta: () => {
        scrollToDropzone();
        analyticsTools.ctaClick("pdf", "scroll_to_dropzone");
      },
    };
  },
};
</script>

<style lang="scss" scoped>
.pdf-example {
  display: block;
  width: 100%;
  max-width: 560px;
  height: auto;
  margin: 0 auto;
  border-radius: $wa-radius-lg;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
}

.pdf-page__next {
  margin-top: 1.5rem;
  text-align: center;
}

.pdf-page__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 2rem;
  padding: 0 1rem 3rem;
  background: #ffffff;

  a {
    color: $c-blue-accent-dark;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
