<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('relationshipProof.heroEyebrow')"
      :title="t('relationshipProof.heroTitle')"
      :subtitle="t('relationshipProof.heroSubtitle')"
      :cta-text="t('relationshipProof.heroCta')"
      cta-to="#dropzone-slot"
      :note="t('relationshipProof.heroNote')"
      @click="trackHeroCta"
    >
      <LandingDocMock :caption="t('courtEvidence.exampleBadge')" />
    </LandingHero>

    <CourtPdfSection
      :title="t('relationshipProof.uploadTitle')"
      checkout-source="proof_of_relationship_pdf"
    />

    <LandingSection
      theme="light"
      :eyebrow="t('relationshipProof.statsEyebrow')"
      :title="t('relationshipProof.statsTitle')"
      :text="t('relationshipProof.statsText')"
    >
      <LandingCards :items="stats" />
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('relationshipProof.casesEyebrow')"
      :title="t('relationshipProof.casesTitle')"
      :text="t('relationshipProof.casesText')"
    >
      <LandingCards :items="useCases" />
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('relationshipProof.privacyEyebrow')"
      :title="t('relationshipProof.privacyTitle')"
      :text="t('relationshipProof.privacyText')"
    />

    <LandingSection theme="light" :title="t('relationshipProof.stepsTitle')">
      <LandingSteps :steps="steps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="exportGuidePath">
          {{ t("relationshipProof.stepsGuideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <LandingSection theme="white" :title="t('relationshipProof.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('relationshipProof.ctaTitle')"
      :cta-text="t('relationshipProof.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('relationshipProof.ctaNote')"
      :disclaimer="t('relationshipProof.disclaimer')"
      @click="trackBottomCta"
    />
  </div>
</template>

<script>
import { ONE_TIME_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";
import CourtPdfSection from "~/components/tools/CourtPdfSection.vue";

export default {
  components: { CourtPdfSection },
  setup() {
    const { t, locale } = useI18n();
    const localePath = useLocalePath();

    function trackHeroCta() {
      analyticsTools.ctaClick("proof_of_relationship", "hero_dropzone");
    }

    function trackBottomCta() {
      scrollToDropzone();
      analyticsTools.ctaClick("proof_of_relationship", "scroll_to_dropzone");
    }
    useSeoMeta({
      title: () => t("relationshipProof.seoTitle"),
      description: () => t("relationshipProof.seoDescription"),
      ogTitle: () => t("relationshipProof.seoTitle"),
      ogDescription: () => t("relationshipProof.seoDescription"),
    });

    // The cost question closes both PDF pages, quoting the real one-time
    // price rather than "a one-time purchase" — /tools/proof-of-relationship
    // had no cost question at all, so a visa applicant could not find out
    // that the download is paid.
    const faq = computed(() => [
      ...[1, 2, 3, 4].map((i) => ({
        q: t(`relationshipProof.faq${i}Q`),
        a: t(`relationshipProof.faq${i}A`),
      })),
      {
        q: t("relationshipProof.faqCostQ"),
        a: t("relationshipProof.faqCostA", {
          price: formatPrice(ONE_TIME_PRICE, locale.value),
        }),
      },
    ]);

    useToolSchema({ faqItems: faq });

    const stats = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        icon: [
          "mdi-chart-timeline-variant",
          "mdi-calendar-range",
          "mdi-account-multiple-outline",
          "mdi-message-text-outline",
        ][i - 1],
        title: t(`relationshipProof.stat${i}Title`),
        text: t(`relationshipProof.stat${i}Text`),
      })),
    );

    const useCases = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        icon: [
          "mdi-ring",
          "mdi-home-heart",
          "mdi-passport",
          "mdi-certificate-outline",
        ][i - 1],
        title: t(`relationshipProof.case${i}Title`),
        text: t(`relationshipProof.case${i}Text`),
        to: i === 4 ? localePath("/tools/court-evidence") : undefined,
        linkText: i === 4 ? t("relationshipProof.caseLinkText") : undefined,
      })),
    );

    const steps = computed(() =>
      [1, 2, 3].map((i) => ({
        title: t(`relationshipProof.step${i}Title`),
        text: t(`relationshipProof.step${i}Text`),
      })),
    );
    // The last crumb is the tool's name from the shared catalogue
    // (composables/useSiteNav.ts), the same string the /tools index, the footer
    // and the header use. Each page used to name itself differently here.
    const breadcrumbs = useToolBreadcrumbs("toolsHub.toolRelationshipTitle");

    return {
      t,
      breadcrumbs,
      exportGuidePath: computed(() =>
        localePath("how-to-export-your-whatsapp-chat"),
      ),
      stats,
      useCases,
      steps,
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
