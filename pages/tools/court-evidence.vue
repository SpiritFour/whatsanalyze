<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('courtEvidence.heroEyebrow')"
      :title="t('courtEvidence.heroTitle')"
      :subtitle="t('courtEvidence.heroSubtitle')"
      :cta-text="t('courtEvidence.heroCta')"
      :cta-to="analyzerPath"
      :note="t('courtEvidence.heroNote')"
      @click="trackHeroCta"
    >
    </LandingHero>

    <LandingSection theme="white">
      <LandingCards :items="pillars" />
    </LandingSection>

    <LandingSection
      theme="light"
      :eyebrow="t('courtEvidence.docEyebrow')"
      :title="t('courtEvidence.docTitle')"
      :text="t('courtEvidence.docText')"
    >
      <LandingCards :items="docFeatures" />
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('courtEvidence.casesEyebrow')"
      :title="t('courtEvidence.casesTitle')"
      :text="t('courtEvidence.casesText')"
    >
      <LandingCards :items="useCases" />
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('courtEvidence.privacyEyebrow')"
      :title="t('courtEvidence.privacyTitle')"
      :text="t('courtEvidence.privacyText')"
    />

    <LandingSection theme="light" :title="t('courtEvidence.stepsTitle')">
      <LandingSteps :steps="steps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="exportGuidePath">
          {{ t("courtEvidence.stepsGuideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <LandingSection theme="white" :title="t('courtEvidence.quotesTitle')">
      <LandingQuotes :quotes="quotes" />
    </LandingSection>

    <LandingSection theme="light" :title="t('courtEvidence.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('courtEvidence.ctaTitle')"
      :cta-text="t('courtEvidence.ctaButton')"
      :cta-to="analyzerPath"
      :note="t('courtEvidence.ctaNote')"
      :disclaimer="t('courtEvidence.disclaimer')"
      @click="trackBottomCta"
    />
  </div>
</template>

<script>
import { ONE_TIME_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";

export default {
  setup() {
    const { t, locale } = useI18n();
    const localePath = useLocalePath();

    function trackHeroCta() {
      analyticsTools.ctaClick("court_evidence", "hero_analyzer");
    }

    function trackBottomCta() {
      analyticsTools.ctaClick("court_evidence", "full_analyzer");
    }
    useSeoMeta({
      title: () => t("courtEvidence.seoTitle"),
      description: () => t("courtEvidence.seoDescription"),
      ogTitle: () => t("courtEvidence.seoTitle"),
      ogDescription: () => t("courtEvidence.seoDescription"),
    });

    // The cost question closes both PDF pages, quoting the real one-time
    // price rather than "a one-time purchase" — /tools/proof-of-relationship
    // had no cost question at all, so a visa applicant could not find out
    // that the download is paid.
    const faq = computed(() => [
      ...[1, 2, 3, 4].map((i) => ({
        q: t(`courtEvidence.faq${i}Q`),
        a: t(`courtEvidence.faq${i}A`),
      })),
      {
        q: t("courtEvidence.faqCostQ"),
        a: t("courtEvidence.faqCostA", {
          price: formatPrice(ONE_TIME_PRICE, locale.value),
        }),
      },
    ]);

    useHead(() => ({
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.value.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        },
      ],
    }));

    const pillars = computed(() =>
      [1, 2, 3].map((i) => ({
        icon: [
          "mdi-cellphone-lock",
          "mdi-format-list-numbered",
          "mdi-clock-fast",
        ][i - 1],
        title: t(`courtEvidence.pillar${i}Title`),
        text: t(`courtEvidence.pillar${i}Text`),
      })),
    );

    const docFeatures = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        icon: [
          "mdi-sort-clock-ascending-outline",
          "mdi-account-clock-outline",
          "mdi-file-document-outline",
          "mdi-chart-bar",
        ][i - 1],
        title: t(`courtEvidence.docCard${i}Title`),
        text: t(`courtEvidence.docCard${i}Text`),
      })),
    );

    const useCases = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        icon: [
          "mdi-shield-alert-outline",
          "mdi-scale-balance",
          "mdi-heart-outline",
          "mdi-briefcase-outline",
        ][i - 1],
        title: t(`courtEvidence.case${i}Title`),
        text: t(`courtEvidence.case${i}Text`),
        to: i === 3 ? localePath("/tools/proof-of-relationship") : undefined,
        linkText: i === 3 ? t("courtEvidence.caseLinkText") : undefined,
      })),
    );

    const steps = computed(() =>
      [1, 2, 3].map((i) => ({
        title: t(`courtEvidence.step${i}Title`),
        text: t(`courtEvidence.step${i}Text`),
      })),
    );

    const quotes = computed(() =>
      [1, 2].map((i) => ({
        text: t(`courtEvidence.quote${i}Text`),
        attribution: t(`courtEvidence.quote${i}Attribution`),
      })),
    );

    // The last crumb is the tool's name from the shared catalogue
    // (composables/useSiteNav.ts), the same string the /tools index, the footer
    // and the header use. Each page used to name itself differently here.
    const breadcrumbs = computed(() => [
      { label: "WhatsAnalyze", to: localePath("/") },
      { label: t("toolsHub.headerTools"), to: localePath("/tools") },
      { label: t("toolsHub.toolCourtTitle") },
    ]);

    return {
      t,
      breadcrumbs,
      // These pages carry no dropzone of their own, so the CTA has to
      // land on the analyzer's upload area rather than the top of the
      // homepage — step 2 tells people to drop a file there.
      analyzerPath: computed(() =>
        localePath({ path: "/", hash: "#dropzone-slot" }),
      ),
      exportGuidePath: computed(() =>
        localePath("how-to-export-your-whatsapp-chat"),
      ),
      pillars,
      docFeatures,
      useCases,
      steps,
      quotes,
      faq,
      trackHeroCta,
      trackBottomCta,
    };
  },
};
</script>

<style lang="scss" scoped>
.landing-page__guide-link {
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
</style>
