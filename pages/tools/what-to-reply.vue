<template>
  <div class="landing-page">
    <LandingHero
      align="left"
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('situationWhatToReply.heroEyebrow')"
      :title="t('situationWhatToReply.heroTitle')"
      :subtitle="t('situationWhatToReply.heroSubtitle')"
      :note="t('situationWhatToReply.heroNote')"
    >
      <!-- The coach lives under an AI reading on the AI page, so the upload is
           here and the visitor goes on as soon as the chat is read. A chat
           restored from earlier in this visit only offers the button, so
           coming back to this page doesn't bounce anyone straight on. -->
      <div
        id="dropzone-slot"
        @change.capture="acted = true"
        @drop.capture="acted = true"
        @click.capture="acted = true"
      >
        <ToolDropzone tool-type="ai" @analyzed="onAnalyzed" />
      </div>
      <div v-if="chatReady" class="hero-next">
        <LandingButton :to="coachPath" @click="trackContinue">
          {{ t("situationWhatToReply.continueButton") }}
        </LandingButton>
      </div>
      <!-- A chat saved on an earlier visit: one tap to its reading and the
           coach conversation kept with it. -->
      <ClientOnly v-else>
        <LibraryOffer
          class="hero-next"
          to="/tools/ai-chat-analyzer"
          :query="COACH_QUERY"
          :label="offerLabel"
          :source="SOURCE"
        />
      </ClientOnly>
    </LandingHero>

    <LandingSection
      theme="white"
      :eyebrow="t('situationWhatToReply.exampleEyebrow')"
      :title="t('situationWhatToReply.exampleTitle')"
      :text="t('situationWhatToReply.exampleText')"
    >
      <ReplyExample />
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('situationWhatToReply.showEyebrow')"
      :title="t('situationWhatToReply.showTitle')"
      :text="t('situationWhatToReply.showText')"
    >
      <LandingCards :items="showCards" />
    </LandingSection>

    <!-- The honest path to the coach: it needs a reading first, and the free
         cloud preview doesn't come with it (pages/tools/ai-chat-analyzer.vue). -->
    <LandingSection
      theme="light"
      :eyebrow="t('situationWhatToReply.stepsEyebrow')"
      :title="t('situationWhatToReply.stepsTitle')"
    >
      <LandingSteps :steps="steps" />
      <h3 class="plans-title">{{ t("situationWhatToReply.plansTitle") }}</h3>
      <LandingCards class="plans" :items="plans" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("toolsAi.guideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('situationWhatToReply.ownWordsEyebrow')"
      :title="t('situationWhatToReply.ownWordsTitle')"
      :text="t('situationWhatToReply.ownWordsText')"
    />

    <LandingSection
      theme="light"
      :eyebrow="t('situationWhatToReply.limitsEyebrow')"
      :title="t('situationWhatToReply.limitsTitle')"
    >
      <LandingCards :items="limits" />
    </LandingSection>

    <LandingSection
      theme="dark"
      :eyebrow="t('situationWhatToReply.privacyEyebrow')"
      :title="t('situationWhatToReply.privacyTitle')"
      :text="t('situationWhatToReply.privacyText')"
    >
      <LandingCards :items="privacy" />
    </LandingSection>

    <!-- The coach hands over to these instead of coaching (utils/ai/coach.js):
         the same words and helplines, so the page promises what it shows. -->
    <LandingSection
      theme="white"
      :eyebrow="t('situationWhatToReply.supportEyebrow')"
      :title="t('situationWhatToReply.supportTitle')"
      :text="t('situationWhatToReply.supportText')"
    >
      <div class="support">
        <v-icon size="24" class="support__icon"
          >mdi-shield-alert-outline</v-icon
        >
        <div>
          <strong>{{ t("toolsAi.coachSupportTitle") }}</strong>
          <p>{{ t("toolsAi.coachSupportText") }}</p>
        </div>
      </div>
      <p class="support__device">
        {{
          t("situationWhatToReply.supportDevice", {
            dontKeep: t("library.dontKeep"),
            saved: t("library.saved"),
          })
        }}
      </p>
    </LandingSection>

    <LandingSection theme="light" :title="t('situationWhatToReply.faqTitle')">
      <LandingFaq :items="faq" />
    </LandingSection>

    <LandingCta
      :title="t('situationWhatToReply.ctaTitle')"
      :cta-text="t('situationWhatToReply.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('situationWhatToReply.ctaNote')"
      :disclaimer="t('situationWhatToReply.disclaimer')"
      @click="onCtaClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import ReplyExample from "~/components/situations/what-to-reply/ReplyExample.vue";
import { analyticsTools } from "~/composables/useAnalytics";
import { useLibrary } from "~/composables/useLibrary";
import { scrollToDropzone } from "~/composables/useToolPage";
import { SUBSCRIPTION_PRICE, formatPrice } from "~/utils/pricing";

/** This page in analytics: the saved-chat offer and the CTA clicks. */
const SOURCE = "landing_what_to_reply";
/**
 * The AI page with "How could we communicate better?" picked, the preset
 * closest to finding a reply. The coach opens under that reading.
 */
const COACH_QUERY = { ask: "better" };

const { t, locale } = useI18n();
const localePath = useLocalePath();
const breadcrumbs = useToolBreadcrumbs("situationWhatToReply.navLabel");

useSeoMeta({
  title: () => t("situationWhatToReply.seoTitle"),
  description: () => t("situationWhatToReply.seoDescription"),
  ogTitle: () => t("situationWhatToReply.ogTitle"),
  ogDescription: () => t("situationWhatToReply.ogDescription"),
  ogType: "website",
  ogUrl: () => `https://whatsanalyze.com${localePath("/tools/what-to-reply")}`,
});

const price = computed(() => formatPrice(SUBSCRIPTION_PRICE, locale.value));

const coachPath = computed(() =>
  localePath({ path: "/tools/ai-chat-analyzer", query: COACH_QUERY }),
);
const acted = ref(false);
const chatReady = ref(false);

// The AI page picks the parsed chat up from shared state.
function onAnalyzed() {
  chatReady.value = true;
  if (acted.value) navigateTo(coachPath.value);
}

const trackContinue = () => analyticsTools.ctaClick(SOURCE, "ai");

function onCtaClick() {
  scrollToDropzone();
  analyticsTools.ctaClick(SOURCE, "other");
}

// LibraryOffer offers the chat opened last; name it the way that chat is.
const library = useLibrary();
const offerLabel = computed(() =>
  library.lastOpened.value?.isGroup
    ? "situationWhatToReply.offerGroup"
    : "situationWhatToReply.offerChat",
);

const cards = (prefix: string, icons: string[], params = {}) =>
  icons.map((icon, i) => ({
    icon,
    title: t(`situationWhatToReply.${prefix}${i + 1}Title`, params),
    text: t(`situationWhatToReply.${prefix}${i + 1}Text`, params),
  }));

const showCards = computed(() =>
  cards("show", [
    "mdi-format-quote-open",
    "mdi-reply-all-outline",
    "mdi-information-outline",
    "mdi-chat-processing-outline",
  ]),
);

const steps = computed(() =>
  [1, 2, 3].map((i) => ({
    title: t(`situationWhatToReply.step${i}Title`),
    // The coach's own button labels, so the steps match the screen.
    text: t(`situationWhatToReply.step${i}Text`, {
      reply: t("toolsAi.coach_reply"),
      ask: t("toolsAi.coach_ask"),
    }),
  })),
);

const plans = computed(() =>
  cards(
    "plan",
    ["mdi-cellphone-lock", "mdi-cloud-outline", "mdi-star-circle-outline"],
    { price: price.value },
  ),
);

const limits = computed(() =>
  cards("limit", [
    "mdi-chart-timeline-variant",
    "mdi-text-box-search-outline",
    "mdi-timer-sand",
    "mdi-alert-circle-outline",
  ]),
);

const privacy = computed(() =>
  cards(
    "privacy",
    ["mdi-cellphone-lock", "mdi-shield-lock-outline", "mdi-incognito"],
    { dontKeep: t("library.dontKeep") },
  ),
);

const faq = computed(() =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`situationWhatToReply.faq${i}Q`),
    a: t(`situationWhatToReply.faq${i}A`, { price: price.value }),
  })),
);

useToolSchema({ faqItems: faq });
</script>

<style lang="scss" scoped>
.hero-next {
  margin-top: 1.5rem;
  text-align: center;
}

.plans-title {
  margin-top: clamp(2.5rem, 6vw, 4rem);
  font-size: clamp(1.3rem, 2.4vw, 1.7rem);
  font-weight: 700;
}

// Under its own heading, not a section title: closer than the cards' default.
.landing-cards.plans {
  margin-top: 1.5rem;
}

.support {
  display: flex;
  gap: 0.9rem;
  max-width: 640px;
  margin: 2rem auto 0;
  padding: 1.2rem 1.4rem;
  border-left: 4px solid #b45309;
  border-radius: 16px;
  background: #f5f5f7;
  text-align: left;
  line-height: 1.5;

  p {
    margin-top: 0.4rem;
  }
}

.support__icon {
  flex: none;
  color: #b45309;
}

.support__device {
  max-width: 640px;
  margin: 1.2rem auto 0;
  font-size: 0.95rem;
  color: rgba(29, 29, 31, 0.68);
}

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
