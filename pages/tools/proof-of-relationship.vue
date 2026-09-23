<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('relationshipProof.heroEyebrow')"
      :title="t('relationshipProof.heroTitle')"
      :subtitle="t('relationshipProof.heroSubtitle')"
      :cta-text="t('relationshipProof.heroCta')"
      :cta-to="analyzerPath"
      :note="t('relationshipProof.heroNote')"
      @click="trackHeroCta"
    >
      :days-label="t('relationshipProof.mockDays')"
      :messages-label="t('relationshipProof.mockMessages')"
      :people-label="t('relationshipProof.mockPeople')"
      :example-label="t('exampleDataLabel')" />
    </LandingHero>

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
      :cta-to="analyzerPath"
      :note="t('relationshipProof.ctaNote')"
      :disclaimer="t('relationshipProof.disclaimer')"
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
      analyticsTools.ctaClick("proof_of_relationship", "hero_analyzer");
    }

    function trackBottomCta() {
      analyticsTools.ctaClick("proof_of_relationship", "full_analyzer");
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
      // These pages carry no dropzone of their own, so the CTA has to
      // land on the analyzer's upload area rather than the top of the
      // homepage — step 2 tells people to drop a file there.
      analyzerPath: computed(() =>
        localePath({ path: "/", hash: "#dropzone-slot" }),
      ),
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
