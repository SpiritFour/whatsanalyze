<template>
  <div class="landing-page">
    <LandingHero
      :eyebrow="t('toolsHub.heroEyebrow')"
      :title="t('toolsHub.heroTitle')"
      :subtitle="t('toolsHub.heroSubtitle')"
    >
      <div class="tools-directory">
        <!-- Group 1: Chat Analytics & Metrics -->
        <div class="tools-group">
          <div class="tools-group__header">
            <span class="tools-group__tag">
              <v-icon size="14" class="mr-1" color="#21a68d"
                >mdi-chart-box-outline</v-icon
              >
              {{ t("toolsHub.analyticsGroupTitle") }}
            </span>
          </div>

          <div class="tools-showcase-grid tools-showcase-grid--4cols">
            <NuxtLink
              v-for="tool in analyticsTools"
              :key="tool.title"
              :to="tool.to"
              class="tool-card"
            >
              <div class="tool-card__header">
                <div
                  class="tool-card__icon-wrap"
                  :style="{ background: tool.bg }"
                >
                  <v-icon :color="tool.color" size="22">{{ tool.icon }}</v-icon>
                </div>
              </div>

              <h3 class="tool-card__title">{{ tool.title }}</h3>
              <p class="tool-card__desc">{{ tool.text }}</p>

              <div class="tool-card__footer">
                <span class="tool-card__action">
                  {{ tool.linkText }}
                  <v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Group 2: Official Documentation & Legal Evidence (Separated) -->
        <div class="tools-group tools-group--court">
          <div class="tools-group__header">
            <span class="tools-group__tag tools-group__tag--court">
              <v-icon size="14" class="mr-1" color="#818cf8"
                >mdi-shield-check-outline</v-icon
              >
              {{ t("toolsHub.courtGroupTitle") }}
            </span>
          </div>

          <div class="tools-showcase-grid tools-showcase-grid--2cols">
            <NuxtLink
              v-for="tool in courtTools"
              :key="tool.title"
              :to="tool.to"
              class="tool-card tool-card--court"
            >
              <div class="tool-card__header">
                <div
                  class="tool-card__icon-wrap"
                  :style="{ background: tool.bg }"
                >
                  <v-icon :color="tool.color" size="24">{{ tool.icon }}</v-icon>
                </div>
                <span class="tool-card__court-badge">
                  <v-icon size="12" class="mr-1"
                    >mdi-file-certificate-outline</v-icon
                  >
                  PDF
                </span>
              </div>

              <h3 class="tool-card__title">{{ tool.title }}</h3>
              <p class="tool-card__desc">{{ tool.text }}</p>

              <div class="tool-card__footer">
                <span class="tool-card__action tool-card__action--court">
                  {{ tool.linkText }}
                  <v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </LandingHero>

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
            {
              "@type": "SoftwareApplication",
              position: 4,
              name: t("toolsHub.toolCounterTitle"),
              url: "https://www.whatsanalyze.com/tools/message-counter",
              applicationCategory: "UtilitiesApplication",
            },
            {
              "@type": "SoftwareApplication",
              position: 5,
              name: t("toolsHub.toolVocabularyTitle"),
              url: "https://www.whatsanalyze.com/tools/word-counter",
              applicationCategory: "UtilitiesApplication",
            },
            {
              "@type": "SoftwareApplication",
              position: 6,
              name: t("toolsHub.toolHeatmapTitle"),
              url: "https://www.whatsanalyze.com/tools/chat-heatmap",
              applicationCategory: "UtilitiesApplication",
            },
          ],
        },
      }),
    },
  ],
}));

const analyticsTools = computed(() => [
  {
    icon: "mdi-timer-sand",
    color: "#21a68d",
    bg: "rgba(33, 166, 141, 0.15)",
    title: t("toolsHub.toolInactivityTitle"),
    text: t("toolsHub.toolInactivityText"),
    to: localePath("/tools/inactivity"),
    linkText: t("toolsHub.openTool"),
  },
  {
    icon: "mdi-counter",
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.15)",
    title: t("toolsHub.toolCounterTitle"),
    text: t("toolsHub.toolCounterText"),
    to: localePath("/tools/message-counter"),
    linkText: t("toolsHub.openTool"),
  },
  {
    icon: "mdi-format-letter-case",
    color: "#c084fc",
    bg: "rgba(192, 132, 252, 0.15)",
    title: t("toolsHub.toolVocabularyTitle"),
    text: t("toolsHub.toolVocabularyText"),
    to: localePath("/tools/word-counter"),
    linkText: t("toolsHub.openTool"),
  },
  {
    icon: "mdi-clock-time-four-outline",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.15)",
    title: t("toolsHub.toolHeatmapTitle"),
    text: t("toolsHub.toolHeatmapText"),
    to: localePath("/tools/chat-heatmap"),
    linkText: t("toolsHub.openTool"),
  },
]);

const courtTools = computed(() => [
  {
    icon: "mdi-scale-balance",
    color: "#818cf8",
    bg: "rgba(129, 140, 248, 0.15)",
    title: t("toolsHub.toolCourtTitle"),
    text: t("toolsHub.toolCourtText"),
    to: localePath("/tools/court-evidence"),
    linkText: t("toolsHub.openTool"),
  },
  {
    icon: "mdi-heart-outline",
    color: "#fb7185",
    bg: "rgba(251, 113, 133, 0.15)",
    title: t("toolsHub.toolRelationshipTitle"),
    text: t("toolsHub.toolRelationshipText"),
    to: localePath("/tools/proof-of-relationship"),
    linkText: t("toolsHub.openTool"),
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
:deep(.landing-hero) {
  padding: clamp(1.8rem, 4vw, 2.8rem) 1.5rem clamp(2rem, 4vw, 3rem);
}
:deep(.landing-hero__inner) {
  max-width: 1180px;
}
:deep(.landing-hero__eyebrow) {
  font-size: 0.85rem;
  margin-bottom: 0.6rem;
  letter-spacing: 0.06em;
}
:deep(.landing-hero__title) {
  font-size: clamp(1.8rem, 3.6vw, 2.75rem);
  line-height: 1.15;
  max-width: 26ch;
}
:deep(.landing-hero__subtitle) {
  font-size: clamp(0.95rem, 1.4vw, 1.1rem);
  line-height: 1.45;
  margin: 0.65rem auto 0;
  max-width: 42rem;
}
:deep(.landing-hero__visual) {
  margin-top: clamp(1.4rem, 2.5vw, 2rem);
}

.tools-directory {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}

.tools-group {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  text-align: left;

  &--court {
    padding-top: 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.tools-group__header {
  display: flex;
  align-items: center;
}

.tools-group__tag {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(245, 245, 247, 0.7);
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  &--court {
    color: #c7d2fe;
    background: rgba(129, 140, 248, 0.1);
    border-color: rgba(129, 140, 248, 0.25);
  }
}

.tools-showcase-grid {
  display: grid;
  gap: 1rem;
  text-align: left;

  &--4cols {
    grid-template-columns: repeat(4, 1fr);

    @media (max-width: 1080px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  &--2cols {
    grid-template-columns: repeat(2, 1fr);

    @media (max-width: 700px) {
      grid-template-columns: 1fr;
    }
  }
}

.tool-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: inherit;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.22);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4);

    .tool-card__action {
      color: #ffffff;
      .v-icon {
        transform: translateX(3px);
      }
    }
  }

  &--court {
    background: linear-gradient(
      180deg,
      rgba(129, 140, 248, 0.07) 0%,
      rgba(255, 255, 255, 0.03) 100%
    );
    border: 1px solid rgba(129, 140, 248, 0.2);

    &:hover {
      border-color: rgba(129, 140, 248, 0.4);
      box-shadow: 0 16px 36px rgba(99, 102, 241, 0.2);
    }
  }
}

.tool-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.tool-card__icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-card__court-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #c7d2fe;
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
}

.tool-card__title {
  font-size: 1.08rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.4rem;
  line-height: 1.3;
}

.tool-card__desc {
  font-size: 0.84rem;
  line-height: 1.45;
  color: rgba(245, 245, 247, 0.68);
  margin-bottom: 1rem;
  flex-grow: 1;
}

.tool-card__footer {
  margin-top: auto;
}

.tool-card__action {
  font-size: 0.85rem;
  font-weight: 600;
  color: $c-blue-accent-light;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;

  .v-icon {
    transition: transform 0.2s ease;
  }

  &--court {
    color: #a5b4fc;
  }
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
