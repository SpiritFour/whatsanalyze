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
    >
      <LandingStatsMock
        :days-label="t('relationshipProof.mockDays')"
        :messages-label="t('relationshipProof.mockMessages')"
        :people-label="t('relationshipProof.mockPeople')"
      />
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
    />
  </div>
</template>

<script>
export default {
  setup() {
    const { t } = useI18n();
    const localePath = useLocalePath();

    useSeoMeta({
      title: () => t("relationshipProof.seoTitle"),
      description: () => t("relationshipProof.seoDescription"),
      ogTitle: () => t("relationshipProof.seoTitle"),
      ogDescription: () => t("relationshipProof.seoDescription"),
    });

    const faq = computed(() =>
      [1, 2, 3, 4].map((i) => ({
        q: t(`relationshipProof.faq${i}Q`),
        a: t(`relationshipProof.faq${i}A`),
      }))
    );

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
      }))
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
      }))
    );

    const steps = computed(() =>
      [1, 2, 3].map((i) => ({
        title: t(`relationshipProof.step${i}Title`),
        text: t(`relationshipProof.step${i}Text`),
      }))
    );
    const breadcrumbs = computed(() => [
      { label: "WhatsAnalyze", to: localePath("/") },
      { label: "Tools", to: localePath("/tools") },
      { label: t("relationshipProof.heroEyebrow") || "Proof of Relationship" },
    ]);

    return {
      t,
      breadcrumbs,
      analyzerPath: computed(() => localePath("/")),
      exportGuidePath: computed(() =>
        localePath("how-to-export-your-whatsapp-chat")
      ),
      stats,
      useCases,
      steps,
      faq,
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
