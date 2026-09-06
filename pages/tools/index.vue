<template>
  <div class="landing-page">
    <LandingHero
      :eyebrow="t('toolsHub.heroEyebrow')"
      :title="t('toolsHub.heroTitle')"
      :subtitle="t('toolsHub.heroSubtitle')"
    >
      <div class="tools-showcase-grid">
        <component
          :is="tool.to ? 'NuxtLink' : 'div'"
          v-for="tool in toolsList"
          :key="tool.title"
          :to="tool.to"
          class="tool-card"
          :class="{
            'tool-card--active': !!tool.to,
            'tool-card--coming': !tool.to,
          }"
        >
          <div class="tool-card__header">
            <div
              class="tool-card__icon-wrap"
              :style="{
                background: tool.bg,
              }"
            >
              <v-icon :color="tool.color" size="24">{{ tool.icon }}</v-icon>
            </div>
            <span
              v-if="tool.to"
              class="tool-card__badge tool-card__badge--live"
            >
              <span class="tool-card__live-dot"></span>
              {{ t("toolsHub.heroCardBadge") }}
            </span>
            <span v-else class="tool-card__badge tool-card__badge--coming">
              {{ t("toolsHub.comingSoon") }}
            </span>
          </div>

          <h3 class="tool-card__title">{{ tool.title }}</h3>
          <p class="tool-card__desc">{{ tool.text }}</p>

          <div class="tool-card__footer">
            <span v-if="tool.to" class="tool-card__action">
              {{ tool.linkText }}
              <v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
            </span>
            <span v-else class="tool-card__coming-text">
              {{ tool.linkText }}
            </span>
          </div>
        </component>
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
          ],
        },
      }),
    },
  ],
}));

const toolsList = computed(() => [
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
  {
    icon: "mdi-counter",
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.15)",
    title: t("toolsHub.toolCounterTitle"),
    text: t("toolsHub.toolCounterText"),
    linkText: t("toolsHub.comingSoon"),
  },
  {
    icon: "mdi-format-letter-case",
    color: "#c084fc",
    bg: "rgba(192, 132, 252, 0.15)",
    title: t("toolsHub.toolVocabularyTitle"),
    text: t("toolsHub.toolVocabularyText"),
    linkText: t("toolsHub.comingSoon"),
  },
  {
    icon: "mdi-clock-time-four-outline",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.15)",
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

.tools-showcase-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  text-align: left;
}

@media (max-width: 960px) {
  .tools-showcase-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
  }
}

@media (max-width: 600px) {
  .tools-showcase-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.tool-card {
  display: flex;
  flex-direction: column;
  padding: 1.15rem 1.25rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: inherit;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;

  &--active {
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
  }

  &--coming {
    opacity: 0.72;
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(255, 255, 255, 0.08);
  }
}

.tool-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.tool-card__icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-card__badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;

  &--live {
    background: rgba(33, 166, 141, 0.15);
    color: #60d8bd;
    border: 1px solid rgba(33, 166, 141, 0.3);
  }

  &--coming {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(245, 245, 247, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }
}

.tool-card__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e676;
  box-shadow: 0 0 8px #00e676;
}

.tool-card__title {
  font-size: 1.08rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.35rem;
  line-height: 1.3;
}

.tool-card__desc {
  font-size: 0.85rem;
  line-height: 1.45;
  color: rgba(245, 245, 247, 0.68);
  margin-bottom: 0.9rem;
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
}

.tool-card__coming-text {
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(245, 245, 247, 0.4);
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
