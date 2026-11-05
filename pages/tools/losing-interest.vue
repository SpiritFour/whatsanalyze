<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('situationLosingInterest.heroEyebrow')"
      :title="t('situationLosingInterest.heroTitle')"
      :subtitle="t('situationLosingInterest.heroSubtitle')"
      :note="t('situationLosingInterest.heroNote')"
    >
      <!-- The numbers are the answer to the question in the title, so the box
           sits right here and they appear on this page, not on another one. -->
      <div
        id="dropzone-slot"
        @change.capture="acted = true"
        @drop.capture="acted = true"
        @click.capture="acted = true"
      >
        <ToolDropzone tool-type="inactivity" @analyzed="onAnalyzed" />
      </div>
      <ClientOnly>
        <LibraryOffer
          class="hero-offer"
          to="/tools/ai-chat-analyzer"
          :query="{ ask: 'worried' }"
          source="landing_losing_interest"
          label="situationLosingInterest.offerLabel"
        />
      </ClientOnly>
    </LandingHero>

    <!-- Not revealed on scroll: it is what the visitor dropped a chat for. -->
    <LandingSection
      v-if="analysis"
      id="results"
      theme="light"
      :reveal="false"
      :eyebrow="t('situationLosingInterest.resultEyebrow')"
      :title="t('situationLosingInterest.resultTitle')"
      :text="t('situationLosingInterest.resultText')"
    >
      <div class="result">
        <LosingInterestResult :analysis="analysis" />
      </div>
      <div class="result__next">
        <LandingButton :to="aiPath" @click="trackAi">
          {{ t("situationLosingInterest.resultAiButton") }}
        </LandingButton>
        <p class="result__note">
          {{ t("situationLosingInterest.resultAiNote") }}
        </p>
        <NuxtLink
          :to="timelinePath"
          class="result__link"
          @click="trackTimeline"
        >
          {{ t("situationLosingInterest.resultTimelineLink") }} →
        </NuxtLink>
      </div>
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('situationLosingInterest.showEyebrow')"
      :title="t('situationLosingInterest.showTitle')"
      :text="t('situationLosingInterest.showText')"
    >
      <LandingCards :items="showCards" />
    </LandingSection>

    <LandingSection
      theme="light"
      :eyebrow="t('situationLosingInterest.exampleEyebrow')"
      :title="t('situationLosingInterest.exampleTitle')"
      :text="t('situationLosingInterest.exampleText')"
    >
      <div class="example">
        <!-- The caption comes first: a reader skimming the cards should know
             they are made up before taking in any number. -->
        <figure class="example__figure">
          <figcaption class="example__caption mono-label">
            {{ t("situationLosingInterest.exampleBadge") }}
          </figcaption>
          <LosingInterestResult :analysis="exampleAnalysis" />
        </figure>
        <div class="example__reading">
          <h3 class="example__reading-title">
            {{ t("situationLosingInterest.exampleReadingTitle") }}
          </h3>
          <ul class="example__notes">
            <li v-for="i in 3" :key="i">
              {{ t(`situationLosingInterest.exampleNote${i}`) }}
            </li>
          </ul>
        </div>
      </div>
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('situationLosingInterest.limitsEyebrow')"
      :title="t('situationLosingInterest.limitsTitle')"
      :text="t('situationLosingInterest.limitsText')"
    >
      <LandingCards :items="limitCards" />
      <!-- The helpline line is the AI coach's, word for word, so the site
           points people to the same place wherever it comes up. -->
      <aside class="support">
        <v-icon class="support__icon" size="24">mdi-heart-outline</v-icon>
        <div>
          <h3 class="support__title">
            {{ t("situationLosingInterest.supportTitle") }}
          </h3>
          <p class="support__text">{{ t("toolsHub.supportText") }}</p>
        </div>
      </aside>
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('situationLosingInterest.aiEyebrow')"
      :title="t('situationLosingInterest.aiTitle')"
      :text="t('situationLosingInterest.aiText')"
    >
      <LandingCards :items="aiCards" />
      <div class="ai__actions">
        <LandingButton :to="aiPath" @click="trackAi">
          {{ t("situationLosingInterest.aiButton") }}
        </LandingButton>
      </div>
    </LandingSection>

    <LandingSection
      theme="light"
      :title="t('situationLosingInterest.faqTitle')"
    >
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('situationLosingInterest.ctaTitle')"
      :cta-text="t('situationLosingInterest.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('situationLosingInterest.ctaNote')"
      :disclaimer="t('situationLosingInterest.disclaimer')"
      @click="onBottomCta"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import LibraryOffer from "~/components/library/LibraryOffer.vue";
import LosingInterestResult from "~/components/situations/losing-interest/LosingInterestResult.vue";
import type { ChatInactivityAnalysis } from "~/composables/useChatTool";
import { analyticsTools } from "~/composables/useAnalytics";
import { scrollToDropzone } from "~/composables/useToolPage";

const SOURCE = "landing_losing_interest";

const { t } = useI18n();
const localePath = useLocalePath();

const breadcrumbs = useToolBreadcrumbs("situationLosingInterest.navLabel");

useSeoMeta({
  title: () => t("situationLosingInterest.seoTitle"),
  description: () => t("situationLosingInterest.seoDescription"),
  ogTitle: () => t("situationLosingInterest.seoTitle"),
  ogDescription: () => t("situationLosingInterest.seoDescription"),
  ogType: "website",
});

const faq = computed(() =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`situationLosingInterest.faq${i}Q`),
    a: t(`situationLosingInterest.faq${i}A`),
  })),
);

useToolSchema({
  faqItems: faq,
  app: {
    nameKey: "situationLosingInterest.appName",
    descriptionKey: "situationLosingInterest.seoDescription",
  },
});

const analysis = ref<ChatInactivityAnalysis | null>(null);
/** Whether the visitor dropped or picked a chat, rather than it being restored. */
const acted = ref(false);

async function onAnalyzed(payload: { analysis: unknown }) {
  analysis.value = payload.analysis as ChatInactivityAnalysis;
  // A chat restored from earlier in this visit stays where it is; one the
  // visitor just added scrolls into view, since on a wide screen it lands
  // below the hero.
  if (!acted.value) return;
  acted.value = false;
  await nextTick();
  document
    .getElementById("results")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// The AI page and the analyzer both pick the chat up from shared state, so
// neither asks for it again.
const aiPath = computed(() =>
  localePath({ path: "/tools/ai-chat-analyzer", query: { ask: "worried" } }),
);
const timelinePath = computed(() =>
  localePath({ path: "/", hash: "#results" }),
);

const trackAi = () => analyticsTools.ctaClick(SOURCE, "ai");
const trackTimeline = () => analyticsTools.ctaClick(SOURCE, "full_analyzer");
function onBottomCta() {
  scrollToDropzone();
  analyticsTools.ctaClick(SOURCE, "other");
}

const cards = (prefix: string, icons: string[]) =>
  icons.map((icon, i) => ({
    icon,
    title: t(`situationLosingInterest.${prefix}${i + 1}Title`),
    text: t(`situationLosingInterest.${prefix}${i + 1}Text`),
  }));

const showCards = computed(() => [
  ...cards("show", [
    "mdi-account-clock-outline",
    "mdi-timer-sand",
    "mdi-reply-all-outline",
    "mdi-clock-time-four-outline",
  ]),
  {
    icon: "mdi-chart-timeline-variant",
    title: t("situationLosingInterest.show5Title"),
    text: t("situationLosingInterest.show5Text"),
    to: localePath("/"),
    linkText: t("situationLosingInterest.show5Link"),
  },
]);

const limitCards = computed(() =>
  cards("limit", [
    "mdi-scale-balance",
    "mdi-calendar-range",
    "mdi-file-export",
    "mdi-chat-processing-outline",
  ]),
);

const aiCards = computed(() =>
  cards("aiCard", [
    "mdi-cellphone-lock",
    "mdi-incognito",
    "mdi-calendar-check",
  ]),
);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Sam and Alex, who are made up, in the shape analyzeInactivity() returns.
 * Only what the result view reads is filled in. The dates are noon, local
 * time, so the prerendered page and the browser print the same day.
 */
const exampleAnalysis = {
  lastMessage: { author: "Alex", date: new Date(0), message: "" },
  timeSinceLastMs: 20 * HOUR,
  inactivityStatus: "active",
  participants: [
    {
      name: "Sam",
      messageCount: 3412,
      avgResponseTimeMs: 38 * MINUTE,
      conversationStartersPct: 54,
    },
    {
      name: "Alex",
      messageCount: 2987,
      avgResponseTimeMs: HOUR + 52 * MINUTE,
      conversationStartersPct: 46,
    },
  ],
  longestGaps: [
    {
      durationMs: 4 * DAY + 6 * HOUR,
      startDate: new Date(2026, 7, 8, 12),
      endDate: new Date(2026, 7, 12, 12),
      brokenBy: "Sam",
    },
    {
      durationMs: 2 * DAY + 3 * HOUR,
      startDate: new Date(2026, 8, 19, 12),
      endDate: new Date(2026, 8, 21, 12),
      brokenBy: "Alex",
    },
    {
      durationMs: DAY + 15 * HOUR,
      startDate: new Date(2026, 6, 3, 12),
      endDate: new Date(2026, 6, 5, 12),
      brokenBy: "Alex",
    },
  ],
  totalMessages: 6399,
  dateRange: { totalDays: 412 },
} as unknown as ChatInactivityAnalysis;
</script>

<style lang="scss" scoped>
.hero-offer {
  max-width: 640px;
  margin: 1rem auto 0;
}

.result {
  max-width: 820px;
  margin: 2.2rem auto 0;
}

.result__next {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}

.result__note {
  max-width: 34rem;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: $wa-ink-muted;
}

.result__link,
.example__caption {
  font-weight: 600;
}

.result__link {
  color: $c-blue-accent-dark;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.example {
  display: grid;
  gap: clamp(1.5rem, 4vw, 2.5rem);
  margin-top: clamp(2.2rem, 5vw, 3.6rem);
  text-align: left;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    align-items: start;
  }
}

.example__figure {
  margin: 0;
  min-width: 0;
}

.example__caption {
  display: inline-block;
  margin-bottom: 0.9rem;
  padding: 3px 10px;
  border-radius: $wa-radius-pill;
  background: $wa-surface-white;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $wa-ink-muted;
}

.example__reading-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.example__notes {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  line-height: 1.55;
  color: $wa-ink-muted;
}

.support {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  max-width: 46rem;
  margin: 2.4rem auto 0;
  padding: 1.4rem 1.6rem;
  border: 1px solid $wa-border-invert;
  border-radius: $wa-radius-xl;
  text-align: left;
}

.support__icon {
  flex-shrink: 0;
  color: $c-blue-accent-light;
  margin-top: 0.15rem;
}

.support__title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
}

.support__text {
  margin: 0;
  line-height: 1.55;
  color: $wa-ink-invert-muted;
}

.ai__actions {
  margin-top: 2.4rem;
}
</style>
