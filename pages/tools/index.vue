<template>
  <div class="landing-page">
    <LandingHero
      :eyebrow="t('toolsHub.heroEyebrow')"
      :title="t('toolsHub.heroTitle')"
      :subtitle="t('toolsHub.heroSubtitle')"
      :cta-text="t('toolsHub.heroCta')"
      :cta-to="localePath('/tools/inactivity')"
      :note="t('toolsHub.heroNote')"
    >
      <div class="tools-hero-preview">
        <div class="tools-hero-card">
          <div class="tools-hero-card__header">
            <span class="tools-hero-card__badge">{{
              t("toolsHub.heroCardBadge")
            }}</span>
            <span class="tools-hero-card__dot"></span>
          </div>
          <h3 class="tools-hero-card__title">
            {{ t("toolsHub.heroCardTitle") }}
          </h3>
          <p class="tools-hero-card__desc">
            {{ t("toolsHub.heroCardDesc") }}
          </p>
          <div class="tools-hero-card__action">
            <LandingButton :to="localePath('/tools/inactivity')">
              {{ t("toolsHub.heroCardBtn") }}
            </LandingButton>
          </div>
        </div>
      </div>
    </LandingHero>

    <!-- Section 1: The Tools Grid -->
    <LandingSection
      theme="light"
      :eyebrow="t('toolsHub.sectionToolsEyebrow')"
      :title="t('toolsHub.sectionToolsTitle')"
      :text="t('toolsHub.sectionToolsText')"
    >
      <LandingCards :items="toolsList" />
    </LandingSection>

    <!-- Section 2: Why Client-Side Tools? (Pillars) -->
    <LandingSection
      theme="white"
      :eyebrow="t('toolsHub.sectionPillarsEyebrow')"
      :title="t('toolsHub.sectionPillarsTitle')"
      :text="t('toolsHub.sectionPillarsText')"
    >
      <LandingCards :items="pillars" />
    </LandingSection>

    <!-- Section 3: 3 Steps to Use -->
    <LandingSection
      theme="light"
      :eyebrow="t('toolsHub.sectionStepsEyebrow')"
      :title="t('toolsHub.sectionStepsTitle')"
    >
      <LandingSteps :steps="steps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("toolsHub.guideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <!-- Section 4: Bottom CTA -->
    <LandingCta
      :title="t('toolsHub.ctaTitle')"
      :cta-text="t('toolsHub.ctaButton')"
      :cta-to="localePath('/')"
      :note="t('toolsHub.ctaNote')"
      :disclaimer="t('toolsHub.disclaimer')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const { t } = useI18n();
const localePath = useLocalePath();

// SEO Metadata
useSeoMeta({
  title: () => t("toolsHub.seoTitle"),
  description: () => t("toolsHub.seoDescription"),
  ogTitle: () => t("toolsHub.ogTitle"),
  ogDescription: () => t("toolsHub.ogDescription"),
  ogType: "website",
  ogUrl: "https://www.whatsanalyze.com/tools",
});

// JSON-LD ItemList Schema
useHead(() => ({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: t("toolsHub.seoTitle"),
        description: t("toolsHub.seoDescription"),
        url: "https://www.whatsanalyze.com/tools",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: [
            {
              "@type": "SoftwareApplication",
              position: 1,
              name: t("toolsHub.toolInactivityTitle"),
              url: "https://www.whatsanalyze.com/tools/inactivity",
              applicationCategory: "UtilitiesApplication",
            },
            {
              "@type": "SoftwareApplication",
              position: 2,
              name: t("toolsHub.toolCourtTitle"),
              url: "https://www.whatsanalyze.com/tools/court-evidence",
              applicationCategory: "UtilitiesApplication",
            },
            {
              "@type": "SoftwareApplication",
              position: 3,
              name: t("toolsHub.toolRelationshipTitle"),
              url: "https://www.whatsanalyze.com/tools/proof-of-relationship",
              applicationCategory: "UtilitiesApplication",
            },
          ],
        },
      }),
    },
  ],
}));

const toolsList = computed(() => [
  {
    icon: "mdi-timer-sand",
    title: t("toolsHub.toolInactivityTitle"),
    text: t("toolsHub.toolInactivityText"),
    to: localePath("/tools/inactivity"),
    linkText: t("toolsHub.openTool"),
  },
  {
    icon: "mdi-scale-balance",
    title: t("toolsHub.toolCourtTitle"),
    text: t("toolsHub.toolCourtText"),
    to: localePath("/tools/court-evidence"),
    linkText: t("toolsHub.openTool"),
  },
  {
    icon: "mdi-heart-outline",
    title: t("toolsHub.toolRelationshipTitle"),
    text: t("toolsHub.toolRelationshipText"),
    to: localePath("/tools/proof-of-relationship"),
    linkText: t("toolsHub.openTool"),
  },
  {
    icon: "mdi-counter",
    title: t("toolsHub.toolCounterTitle"),
    text: t("toolsHub.toolCounterText"),
    linkText: t("toolsHub.comingSoon"),
  },
  {
    icon: "mdi-format-letter-case",
    title: t("toolsHub.toolVocabularyTitle"),
    text: t("toolsHub.toolVocabularyText"),
    linkText: t("toolsHub.comingSoon"),
  },
  {
    icon: "mdi-clock-time-four-outline",
    title: t("toolsHub.toolHeatmapTitle"),
    text: t("toolsHub.toolHeatmapText"),
    linkText: t("toolsHub.comingSoon"),
  },
]);

const pillars = computed(() => [
  {
    icon: "mdi-cellphone-lock",
    title: t("toolsHub.pillar1Title"),
    text: t("toolsHub.pillar1Text"),
  },
  {
    icon: "mdi-lightning-bolt-outline",
    title: t("toolsHub.pillar2Title"),
    text: t("toolsHub.pillar2Text"),
  },
  {
    icon: "mdi-lock-open-outline",
    title: t("toolsHub.pillar3Title"),
    text: t("toolsHub.pillar3Text"),
  },
]);

const steps = computed(() => [
  {
    title: t("toolsHub.step1Title"),
    text: t("toolsHub.step1Text"),
  },
  {
    title: t("toolsHub.step2Title"),
    text: t("toolsHub.step2Text"),
  },
  {
    title: t("toolsHub.step3Title"),
    text: t("toolsHub.step3Text"),
  },
]);
</script>

<style lang="scss" scoped>
.tools-hero-preview {
  max-width: 520px;
  margin: 0 auto;
}

.tools-hero-card {
  background: #ffffff;
  color: #1d1d1f;
  border-radius: 20px;
  padding: clamp(1.6rem, 4vw, 2.4rem);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
  text-align: left;
}

.tools-hero-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.tools-hero-card__badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 3px 10px;
  border-radius: 6px;
}

.tools-hero-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00e676;
  box-shadow: 0 0 8px #00e676;
}

.tools-hero-card__title {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.6rem;
  color: #0f172a;
}

.tools-hero-card__desc {
  font-size: 0.95rem;
  line-height: 1.55;
  color: rgba(29, 29, 31, 0.68);
  margin: 0 0 1.6rem;
}

.tools-hero-card__action {
  text-align: right;
}

.landing-page__guide-link {
  margin-top: 2rem;
  text-align: center;

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
