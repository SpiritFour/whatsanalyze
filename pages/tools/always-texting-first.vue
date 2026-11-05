<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('situationTextingFirst.heroEyebrow')"
      :title="t('situationTextingFirst.heroTitle')"
      :subtitle="t('situationTextingFirst.heroSubtitle')"
      :note="t('situationTextingFirst.heroNote')"
    >
      <!-- The numbers are worked out right here, under the hero, rather than
           on the inactivity tool: this visitor came with one question. -->
      <div
        id="dropzone-slot"
        @change.capture="acted = true"
        @drop.capture="acted = true"
        @click.capture="acted = true"
      >
        <ToolDropzone
          tool-type="inactivity"
          @analyzed="onAnalyzed"
          @reset="onReset"
        />
      </div>
      <!-- A saved chat already counts its starts in the box above ("Use a
           saved chat"), so the shortcut offered beside it is the next step. -->
      <ClientOnly>
        <LibraryOffer
          class="hero-offer"
          to="/tools/ai-chat-analyzer"
          :query="{ ask: 'effort' }"
          :source="SOURCE"
          label="situationTextingFirst.offerLabel"
        />
      </ClientOnly>
    </LandingHero>

    <LandingSection
      v-if="analysis"
      id="texting-first-results"
      theme="light"
      :reveal="false"
      :eyebrow="t('situationTextingFirst.resultsEyebrow')"
      :title="t('situationTextingFirst.resultsTitle')"
      :text="t('situationTextingFirst.resultsText')"
    >
      <p v-if="fewConversations" class="results__few" role="status">
        <v-icon size="18">mdi-information-outline</v-icon>
        {{
          t("situationTextingFirst.resultsFew", {
            count:
              analysis.conversationInitiations.total.toLocaleString(locale),
          })
        }}
      </p>
      <div class="results__numbers">
        <TextingFirstNumbers
          :people="people"
          :total-starts="analysis.conversationInitiations.total"
        />
      </div>
      <p class="results__how">{{ t("situationTextingFirst.resultsHow") }}</p>

      <div class="next-step">
        <v-icon size="28" class="next-step__icon">mdi-creation-outline</v-icon>
        <h3 class="next-step__title">
          {{ t("situationTextingFirst.nextTitle") }}
        </h3>
        <p class="next-step__text">
          {{ t("situationTextingFirst.nextText") }}
        </p>
        <LandingButton :to="aiPath" @click="trackAi">
          {{ t("situationTextingFirst.nextButton") }}
        </LandingButton>
        <p class="next-step__note">
          {{ t("situationTextingFirst.nextNote") }}
        </p>
        <NuxtLink
          :to="analyzerPath"
          class="next-step__link"
          @click="trackFullAnalyzer"
        >
          {{ t("toolsAi.fullAnalyzer") }}
        </NuxtLink>
      </div>
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('situationTextingFirst.showEyebrow')"
      :title="t('situationTextingFirst.showTitle')"
      :text="t('situationTextingFirst.showText')"
    >
      <LandingCards :items="showCards" />
    </LandingSection>

    <!-- Made-up people through the same view the visitor's own chat gets,
         and a made-up reading of the question the next step asks. -->
    <LandingSection
      theme="light"
      :eyebrow="t('situationTextingFirst.exampleEyebrow')"
      :title="t('situationTextingFirst.exampleTitle')"
      :text="t('situationTextingFirst.exampleText')"
    >
      <figure class="example">
        <TextingFirstNumbers
          :people="examplePeople"
          :total-starts="EXAMPLE_TOTAL_STARTS"
        />
        <div class="example__report">
          <AiReport :report="exampleReport" />
        </div>
        <figcaption class="example__caption mono-label">
          {{ t("situationTextingFirst.exampleCaption") }}
        </figcaption>
      </figure>
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('situationTextingFirst.limitsEyebrow')"
      :title="t('situationTextingFirst.limitsTitle')"
      :text="t('situationTextingFirst.limitsText')"
    >
      <LandingCards :items="limitCards" />
      <aside class="support">
        <v-icon size="22" class="support__icon">mdi-heart-outline</v-icon>
        <div>
          <strong class="support__title">
            {{ t("situationTextingFirst.supportTitle") }}
          </strong>
          <p class="support__text">{{ t("toolsAi.coachSupportText") }}</p>
        </div>
      </aside>
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('situationTextingFirst.privacyEyebrow')"
      :title="t('situationTextingFirst.privacyTitle')"
    >
      <LandingCards :items="privacyCards" />
    </LandingSection>

    <LandingSection
      theme="light"
      :title="t('situationTextingFirst.stepsTitle')"
    >
      <LandingSteps :steps="steps" />
      <p class="guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("situationTextingFirst.stepsGuide") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <LandingSection theme="white" :title="t('situationTextingFirst.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('situationTextingFirst.ctaTitle')"
      :cta-text="t('situationTextingFirst.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('situationTextingFirst.ctaNote')"
      :disclaimer="t('situationTextingFirst.disclaimer')"
      @click="onBottomCtaClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import AiReport from "~/components/ai/AiReport.vue";
import TextingFirstNumbers, {
  type TextingFirstPerson,
} from "~/components/situations/always-texting-first/TextingFirstNumbers.vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import type { ChatInactivityAnalysis } from "~/composables/useChatTool";
import { analyticsTools } from "~/composables/useAnalytics";
import type { AiReport as AiReportData } from "~/utils/ai/report";
import { SUBSCRIPTION_PRICE, formatPrice } from "~/utils/pricing";

/** This page in analytics: the saved-chat offer and every CTA. */
const SOURCE = "landing_texting_first";

const { t, locale } = useI18n();
const localePath = useLocalePath();

// Not in the shared tool catalogue (composables/useSiteNav.ts) yet, so the
// last crumb is this page's own name.
const breadcrumbs = computed(() => [
  { label: "WhatsAnalyze", to: localePath("/") },
  { label: t("toolsHub.headerTools"), to: localePath("/tools") },
  { label: t("situationTextingFirst.navLabel") },
]);

useSeoMeta({
  title: () => t("situationTextingFirst.seoTitle"),
  description: () => t("situationTextingFirst.seoDescription"),
  ogTitle: () => t("situationTextingFirst.seoTitle"),
  ogDescription: () => t("situationTextingFirst.seoDescription"),
  ogType: "website",
});

const faq = computed(() =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`situationTextingFirst.faq${i}Q`),
    a: t(`situationTextingFirst.faq${i}A`, {
      price: formatPrice(SUBSCRIPTION_PRICE, locale.value),
    }),
  })),
);

useToolSchema({
  faqItems: faq,
  app: {
    nameKey: "situationTextingFirst.seoTitle",
    descriptionKey: "situationTextingFirst.seoDescription",
  },
});

// -- the visitor's chat -------------------------------------------------------

const analysis = ref<ChatInactivityAnalysis | null>(null);
/** Set by a pick or a drop, so a chat restored on arrival doesn't scroll. */
const acted = ref(false);

/** Fewer conversations than this, and the share can tip on a single one. */
const FEW_CONVERSATIONS = 10;
const fewConversations = computed(
  () =>
    !!analysis.value &&
    analysis.value.conversationInitiations.total < FEW_CONVERSATIONS,
);

/** Whoever started the most first, as the question is about starting. */
const people = computed<TextingFirstPerson[]>(() =>
  [...(analysis.value?.participants ?? [])]
    .sort(
      (a, b) =>
        b.conversationStartersCount - a.conversationStartersCount ||
        b.messageCount - a.messageCount,
    )
    .map((p) => ({
      name: p.name,
      startsCount: p.conversationStartersCount,
      startsPct: p.conversationStartersPct,
      avgReplyMs: p.avgResponseTimeMs,
      sinceLastMs: p.timeSinceLastMs,
      messageCount: p.messageCount,
    })),
);

async function onAnalyzed(payload: { analysis: unknown }) {
  analysis.value = payload.analysis as ChatInactivityAnalysis;
  if (!acted.value) return;
  acted.value = false;
  await nextTick();
  document
    .getElementById("texting-first-results")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function onReset() {
  analysis.value = null;
}

// The AI page picks the chat this page parsed up from shared state, so the
// question arrives already asked and nothing is uploaded again.
const aiPath = computed(() =>
  localePath({ path: "/tools/ai-chat-analyzer", query: { ask: "effort" } }),
);
const analyzerPath = computed(() =>
  localePath({ path: "/", hash: "#results" }),
);

const trackAi = () => analyticsTools.ctaClick(SOURCE, "ai");
const trackFullAnalyzer = () =>
  analyticsTools.ctaClick(SOURCE, "full_analyzer");

function onBottomCtaClick() {
  scrollToDropzone();
  analyticsTools.ctaClick(SOURCE, "other");
}

// -- the sections -------------------------------------------------------------

const cards = (prefix: string, icons: string[]) =>
  icons.map((icon, i) => ({
    icon,
    title: t(`situationTextingFirst.${prefix}${i + 1}Title`),
    text: t(`situationTextingFirst.${prefix}${i + 1}Text`),
  }));

const showCards = computed(() =>
  cards("show", [
    "mdi-reply-all-outline",
    "mdi-clock-fast",
    "mdi-clock-time-four-outline",
    "mdi-creation-outline",
  ]),
);

const limitCards = computed(() =>
  cards("limit", [
    "mdi-account-multiple-outline",
    "mdi-weather-night",
    "mdi-scale-balance",
    "mdi-chart-timeline-variant",
  ]),
);

const privacyCards = computed(() =>
  cards("privacy", [
    "mdi-cellphone-lock",
    "mdi-shield-lock-outline",
    "mdi-incognito",
  ]),
);

const steps = computed(() =>
  [1, 2, 3].map((i) => ({
    title: t(`situationTextingFirst.step${i}Title`),
    text: t(`situationTextingFirst.step${i}Text`),
  })),
);

// -- the example: Mia and Leo are made up -------------------------------------

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const EXAMPLE_TOTAL_STARTS = 64;

const examplePeople: TextingFirstPerson[] = [
  {
    name: "Mia",
    startsCount: 41,
    startsPct: 64,
    avgReplyMs: 52 * MINUTE,
    sinceLastMs: 3 * HOUR,
    messageCount: 2318,
  },
  {
    name: "Leo",
    startsCount: 23,
    startsPct: 36,
    avgReplyMs: 9 * MINUTE,
    sinceLastMs: 2 * HOUR,
    messageCount: 2104,
  },
];

const exampleReport = computed<AiReportData>(() => ({
  kind: "ai",
  version: 1,
  question: t("toolsAi.ask_effort"),
  ranOn: "local",
  coverage: null,
  insights: {
    answer: t("situationTextingFirst.exampleAnswer"),
    vibe: t("situationTextingFirst.exampleVibe"),
    summary: t("situationTextingFirst.exampleSummary"),
    people: [],
    dynamics: [],
    topics: [],
    highlights: [],
  },
}));
</script>

<style lang="scss" scoped>
.hero-offer {
  max-width: 640px;
  margin: 1.2rem auto 0;
}

.results__few {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  max-width: 44rem;
  margin: 1.6rem auto 0;
  padding: 0.8rem 1rem;
  border-radius: $wa-radius-md;
  background: rgba(255, 212, 92, 0.25);
  color: $wa-ink;
  font-size: 0.95rem;
  text-align: left;
}

.results__numbers {
  margin-top: 2.4rem;
}

.results__how {
  max-width: 44rem;
  margin: 1.4rem auto 0;
  color: $wa-ink-muted;
  font-size: 0.9rem;
  line-height: 1.5;
}

.next-step {
  max-width: 40rem;
  margin: 3rem auto 0;
  padding: clamp(1.6rem, 4vw, 2.4rem);
  border-radius: $wa-radius-xl;
  background: $wa-surface-white;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
}

.next-step__icon {
  color: $wa-accent;
}

.next-step__title {
  margin-top: 0.6rem;
  font-size: clamp(1.3rem, 3vw, 1.6rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.next-step__text {
  margin: 0.8rem auto 1.6rem;
  color: $wa-ink-muted;
  line-height: 1.55;
}

.next-step__note {
  margin-top: 1rem;
  color: $wa-ink-faint;
  font-size: 0.85rem;
}

.next-step__link,
.guide-link a {
  color: $c-blue-accent-dark;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.next-step__link {
  display: inline-block;
  margin-top: 1rem;
  font-size: 0.95rem;
}

.example {
  margin: 2.4rem auto 0;
}

.example__report {
  max-width: 640px;
  margin: 1.6rem auto 0;
  text-align: left;
}

.example__caption {
  margin-top: 1.2rem;
  color: $wa-ink-faint;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.support {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  max-width: 44rem;
  margin: 2.4rem auto 0;
  padding: 1.2rem 1.4rem;
  border-radius: $wa-radius-lg;
  border: 1px solid $wa-border;
  text-align: left;
}

.support__icon {
  flex-shrink: 0;
  color: $wa-accent-dark;
}

.support__title {
  display: block;
  margin-bottom: 0.3rem;
}

.support__text {
  margin: 0;
  color: $wa-ink-muted;
  font-size: 0.95rem;
  line-height: 1.5;
}

.guide-link {
  margin-top: 2rem;
}
</style>
