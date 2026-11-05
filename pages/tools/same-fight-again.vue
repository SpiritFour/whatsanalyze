<template>
  <div class="landing-page">
    <!-- The upload sits in the hero, as on the AI page this hands over to:
         someone searching for this has the chat open in the next tab and
         came to do something with it. -->
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('situationSameFight.heroEyebrow')"
      :title="t('situationSameFight.heroTitle')"
      :subtitle="t('situationSameFight.heroSubtitle')"
      :note="t('situationSameFight.heroNote')"
    >
      <!-- A chat restored from earlier in this visit only offers the button,
           so coming back to this page does not bounce anyone straight on to
           the AI. -->
      <div
        id="dropzone-slot"
        @change.capture="acted = true"
        @drop.capture="acted = true"
        @click.capture="acted = true"
      >
        <ToolDropzone tool-type="ai" @analyzed="onAnalyzed" />
      </div>
      <div v-if="chatReady" class="upload__next">
        <LandingButton :to="aiPath" @click="trackContinue">
          {{ t("situationSameFight.continueButton") }}
        </LandingButton>
      </div>
      <ClientOnly>
        <LibraryOffer
          class="upload__offer"
          to="/tools/ai-chat-analyzer"
          :query="{ ask: 'better' }"
          source="landing_same_fight"
        />
      </ClientOnly>
      <p class="upload__guide">
        <NuxtLink :to="exportGuidePath">
          {{ t("situationSameFight.exportGuide") }} →
        </NuxtLink>
      </p>
    </LandingHero>

    <!-- Only what the product really computes: the AI's answer to the
         "better" question, and the inactivity and heatmap tools' numbers. -->
    <LandingSection
      theme="white"
      :eyebrow="t('situationSameFight.showEyebrow')"
      :title="t('situationSameFight.showTitle')"
      :text="t('situationSameFight.showText')"
    >
      <LandingCards class="shows" :items="shows" />
    </LandingSection>

    <!-- Made up, and said to be: never anything from a real chat. -->
    <LandingSection
      theme="light"
      :eyebrow="t('situationSameFight.exampleEyebrow')"
      :title="t('situationSameFight.exampleTitle')"
      :text="t('situationSameFight.exampleText')"
    >
      <figure class="example">
        <AiReport :report="exampleReport" />
        <div class="example__coach">
          <span class="example__label mono-label">
            {{ t("toolsAi.coach_reply") }}
          </span>
          <p class="example__bubble example__bubble--me">
            {{ t("situationSameFight.exampleDraft") }}
          </p>
          <p class="example__bubble">
            {{ t("situationSameFight.exampleRewrite") }}
            <span class="example__why">
              {{ t("situationSameFight.exampleWhy") }}
            </span>
          </p>
        </div>
        <figcaption class="example__caption mono-label">
          {{ t("situationSameFight.exampleBadge") }}
        </figcaption>
      </figure>
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('situationSameFight.limitsEyebrow')"
      :title="t('situationSameFight.limitsTitle')"
    >
      <LandingCards :items="limits" />
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('situationSameFight.privacyEyebrow')"
      :title="t('situationSameFight.privacyTitle')"
      :text="t('situationSameFight.privacyText')"
    >
      <LandingCards :items="pillars" />
    </LandingSection>

    <!-- An argument that frightens someone is not a communication pattern.
         The helpline line is the coach's own, so both say the same thing. -->
    <LandingSection
      theme="light"
      :eyebrow="t('situationSameFight.supportEyebrow')"
      :title="t('situationSameFight.supportTitle')"
      :text="t('situationSameFight.supportText')"
    >
      <div class="support" role="note">
        <v-icon size="28" class="support__icon">
          mdi-shield-alert-outline
        </v-icon>
        <p>{{ t("toolsAi.coachSupportText") }}</p>
        <a
          class="support__link"
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener"
        >
          {{ t("situationSameFight.supportLink") }} →
        </a>
      </div>
    </LandingSection>

    <LandingSection theme="white" :title="t('situationSameFight.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('situationSameFight.ctaTitle')"
      :cta-text="t('situationSameFight.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('situationSameFight.ctaNote')"
      :disclaimer="t('situationSameFight.disclaimer')"
      @click="onCtaClick"
    />
  </div>
</template>

<script>
import { SUBSCRIPTION_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsTools } from "~/composables/useAnalytics";
import AiReport from "~/components/ai/AiReport.vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import { scrollToDropzone } from "~/composables/useToolPage";

const SOURCE = "landing_same_fight";

export default {
  components: { AiReport, ToolDropzone },
  setup() {
    const { t, locale } = useI18n();
    const localePath = useLocalePath();

    useSeoMeta({
      title: () => t("situationSameFight.seoTitle"),
      description: () => t("situationSameFight.seoDescription"),
      ogTitle: () => t("situationSameFight.ogTitle"),
      ogDescription: () => t("situationSameFight.ogDescription"),
      ogType: "website",
      ogUrl: () =>
        `https://whatsanalyze.com${localePath("/tools/same-fight-again")}`,
    });

    const shows = computed(() =>
      [
        { icon: "mdi-creation-outline" },
        {
          icon: "mdi-weather-night",
          to: localePath("/tools/chat-heatmap"),
        },
        {
          icon: "mdi-account-clock-outline",
          to: localePath("/tools/inactivity"),
        },
        { icon: "mdi-clock-fast", to: localePath("/tools/inactivity") },
        { icon: "mdi-timer-sand", to: localePath("/tools/inactivity") },
        { icon: "mdi-chat-processing-outline" },
      ].map((card, i) => ({
        ...card,
        title: t(`situationSameFight.show${i + 1}Title`),
        text: t(`situationSameFight.show${i + 1}Text`),
        linkText: card.to ? t(`situationSameFight.show${i + 1}Link`) : "",
      })),
    );

    // The real report component with made-up insights, asked the very
    // question the drop box hands over, in the AI page's own words.
    const exampleReport = computed(() => ({
      kind: "ai",
      version: 1,
      question: t("toolsAi.ask_better"),
      ranOn: "local",
      coverage: null,
      insights: {
        answer: t("situationSameFight.exampleAnswer"),
        vibe: t("situationSameFight.exampleVibe"),
        summary: t("situationSameFight.exampleSummary"),
        people: [],
        dynamics: [1, 2].map((i) => ({
          title: t(`situationSameFight.exampleDynamic${i}Title`),
          description: t(`situationSameFight.exampleDynamic${i}Text`),
        })),
        topics: [],
        highlights: [],
      },
    }));

    const limits = computed(() =>
      [
        "mdi-scale-balance",
        "mdi-text-box-search-outline",
        "mdi-chart-timeline-variant",
      ].map((icon, i) => ({
        icon,
        title: t(`situationSameFight.limit${i + 1}Title`),
        text: t(`situationSameFight.limit${i + 1}Text`),
      })),
    );

    const pillars = computed(() =>
      ["mdi-cellphone-lock", "mdi-shield-lock-outline", "mdi-incognito"].map(
        (icon, i) => ({
          icon,
          title: t(`situationSameFight.privacy${i + 1}Title`),
          text: t(`situationSameFight.privacy${i + 1}Text`),
        }),
      ),
    );

    const faq = computed(() =>
      [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        q: t(`situationSameFight.faq${i}Q`),
        a: t(`situationSameFight.faq${i}A`, {
          price: formatPrice(SUBSCRIPTION_PRICE, locale.value),
        }),
      })),
    );

    useToolSchema({ faqItems: faq });

    const aiPath = computed(() =>
      localePath({
        path: "/tools/ai-chat-analyzer",
        query: { ask: "better" },
      }),
    );
    const acted = ref(false);
    const chatReady = ref(false);

    return {
      t,
      breadcrumbs: useToolBreadcrumbs("situationSameFight.navLabel"),
      exportGuidePath: computed(() =>
        localePath("how-to-export-your-whatsapp-chat"),
      ),
      aiPath,
      acted,
      chatReady,
      // The AI page picks the parsed chat up from shared state, with
      // "How could we communicate better?" already picked. Never the
      // "arguments" preset: this page is about the pattern, not a winner.
      onAnalyzed: () => {
        chatReady.value = true;
        if (acted.value) navigateTo(aiPath.value);
      },
      trackContinue: () => analyticsTools.ctaClick(SOURCE, "ai"),
      onCtaClick: () => {
        scrollToDropzone();
        analyticsTools.ctaClick(SOURCE, "scroll_to_dropzone");
      },
      shows,
      exampleReport,
      limits,
      pillars,
      faq,
    };
  },
};
</script>

<style lang="scss" scoped>
// Six cards: three across, two across or one, never a row with a gap in it.
.landing-cards.shows {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
}

.upload__next {
  margin-top: 1.5rem;
  text-align: center;
}

.upload__offer {
  margin-top: 1.2rem;
  text-align: center;
}

.upload__guide {
  margin-top: 1.2rem;
  text-align: center;
  font-size: 0.95rem;

  a {
    color: $c-blue-accent-light;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.example {
  max-width: 720px;
  margin: clamp(2.2rem, 5vw, 3.6rem) auto 0;
  text-align: left;

  // The caption already says it is made up; the report's own "take this as
  // a fun perspective" line reads wrong next to an argument.
  :deep(.report-disclaimer) {
    display: none;
  }
}

.example__coach {
  display: grid;
  gap: 0.6rem;
  margin-top: 1.6rem;
}

.example__label {
  font-size: 0.78rem;
  color: #157a67;
}

.example__bubble {
  max-width: 90%;
  background: #fff;
  border-radius: 16px;
  padding: 0.9rem 1.1rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  line-height: 1.5;
  overflow-wrap: anywhere;

  &--me {
    justify-self: end;
    background: #e7f6f2;
  }
}

.example__why {
  display: block;
  margin-top: 0.6rem;
  font-size: 0.9rem;
  color: rgba(29, 29, 31, 0.65);
}

.example__caption {
  margin-top: 1.4rem;
  text-align: center;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(29, 29, 31, 0.55);
}

.support {
  display: grid;
  justify-items: start;
  gap: 0.8rem;
  max-width: 46rem;
  margin: 2rem auto 0;
  padding: 1.4rem 1.6rem;
  border-left: 4px solid #b45309;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  line-height: 1.55;
}

.support__icon {
  color: #b45309;
}

.support__link {
  color: $c-blue-accent-dark;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
