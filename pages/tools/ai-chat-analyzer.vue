<template>
  <div class="landing-page">
    <LandingHero
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('toolsAi.heroEyebrow')"
      :title="t('toolsAi.heroTitle')"
      :subtitle="t('toolsAi.heroSubtitle')"
      :note="t('toolsAi.heroNote')"
    >
      <div id="dropzone-slot">
        <ToolDropzone tool-type="ai" @analyzed="onChatLoaded" @reset="reset" />
      </div>
    </LandingHero>

    <!-- Where to run it: the visitor's call, with the trade-offs spelled out -->
    <LandingSection
      v-if="messages && !insights"
      id="ai-choose"
      theme="light"
      :eyebrow="t('toolsAi.chooseEyebrow')"
      :title="t('toolsAi.chooseTitle')"
      :text="t('toolsAi.chooseText')"
    >
      <div class="mode-grid">
        <div
          v-for="mode in modes"
          :key="mode.id"
          class="mode-card"
          :class="{ 'mode-card--featured': mode.id === 'cloud' }"
        >
          <div class="mode-card__head">
            <v-icon size="28" :color="mode.color">{{ mode.icon }}</v-icon>
            <div>
              <h3 class="mode-card__title">{{ mode.title }}</h3>
              <span class="mode-card__tag mono-label">{{ mode.tag }}</span>
            </div>
          </div>
          <ul class="mode-card__list">
            <li v-for="pro in mode.pros" :key="pro">
              <v-icon size="18" color="#21a68d"
                >mdi-check-circle-outline</v-icon
              >
              {{ pro }}
            </li>
            <li v-for="con in mode.cons" :key="con" class="mode-card__con">
              <v-icon size="18" color="#a0aec0"
                >mdi-minus-circle-outline</v-icon
              >
              {{ con }}
            </li>
          </ul>

          <p v-if="mode.unavailable" class="mode-card__note">
            {{ mode.unavailable }}
          </p>
          <LandingButton
            v-else-if="mode.id === 'cloud' && !isSubscriptionValid"
            :to="localePath('/subscribe')"
            @click="analyticsTools.ctaClick('ai', 'subscribe')"
          >
            {{ t("toolsAi.cloudSubscribe") }}
          </LandingButton>
          <button
            v-else
            type="button"
            class="mode-card__btn"
            :disabled="running !== null"
            @click="run(mode.id)"
          >
            {{ mode.button }}
          </button>
          <p v-if="mode.id === 'cloud'" class="mode-card__fineprint">
            {{ t("toolsAi.cloudConsent") }}
          </p>
        </div>
      </div>

      <details class="sent-preview">
        <summary>{{ t("toolsAi.previewToggle") }}</summary>
        <p>{{ t("toolsAi.previewText") }}</p>
        <pre>{{ cloudPreview }}</pre>
      </details>

      <div v-if="running" class="ai-progress" role="status">
        <v-progress-linear
          :model-value="
            running === 'local' && progress < 1 ? progress * 100 : undefined
          "
          :indeterminate="running === 'cloud' || progress >= 1"
          color="#21a68d"
          rounded
        />
        <p>{{ progressText }}</p>
      </div>
      <p v-if="errorKey" class="ai-error" role="alert">
        <v-icon size="18">mdi-alert-circle-outline</v-icon>
        {{ t(`toolsAi.error_${errorKey}`) }}
      </p>
    </LandingSection>

    <!-- The answer, the same shape whichever model wrote it -->
    <LandingSection
      v-if="insights"
      id="ai-report"
      theme="light"
      :eyebrow="
        ranOn === 'cloud' ? t('toolsAi.reportCloud') : t('toolsAi.reportLocal')
      "
      :title="t('toolsAi.reportTitle')"
    >
      <div class="report">
        <div class="report-card report-summary">
          <span class="vibe-pill">
            <v-icon size="16">mdi-creation-outline</v-icon>
            {{ insights.vibe }}
          </span>
          <p>{{ insights.summary }}</p>
        </div>

        <h3 class="report-heading">{{ t("toolsAi.peopleTitle") }}</h3>
        <div class="report-grid">
          <div v-for="p in insights.people" :key="p.name" class="report-card">
            <div class="person-head">
              <span class="avatar-circle">{{ p.name.charAt(0) }}</span>
              <div>
                <strong>{{ p.name }}</strong>
                <span class="mono-label person-role">{{ p.role }}</span>
              </div>
            </div>
            <p>{{ p.style }}</p>
          </div>
        </div>

        <h3 class="report-heading">{{ t("toolsAi.dynamicsTitle") }}</h3>
        <div class="report-grid">
          <div
            v-for="d in insights.dynamics"
            :key="d.title"
            class="report-card"
          >
            <strong>{{ d.title }}</strong>
            <p>{{ d.description }}</p>
          </div>
        </div>

        <h3 class="report-heading">{{ t("toolsAi.topicsTitle") }}</h3>
        <div class="report-grid">
          <div
            v-for="tp in insights.topics"
            :key="tp.title"
            class="report-card"
          >
            <strong>{{ tp.title }}</strong>
            <p>{{ tp.description }}</p>
          </div>
        </div>

        <h3 class="report-heading">{{ t("toolsAi.highlightsTitle") }}</h3>
        <ul class="report-card highlights">
          <li v-for="h in insights.highlights" :key="h">{{ h }}</li>
        </ul>

        <p class="report-disclaimer">{{ t("toolsAi.reportDisclaimer") }}</p>
        <div class="report-actions">
          <button
            v-if="ranOn === 'local'"
            type="button"
            class="mode-card__btn"
            @click="insights = null"
          >
            {{ t("toolsAi.tryCloud") }}
          </button>
          <LandingButton
            :to="localePath({ path: '/', hash: '#results' })"
            @click="analyticsTools.ctaClick('ai', 'full_analyzer')"
          >
            {{ t("toolsAi.fullAnalyzer") }}
          </LandingButton>
        </div>
      </div>
    </LandingSection>

    <LandingSection
      theme="white"
      :eyebrow="t('toolsAi.howEyebrow')"
      :title="t('toolsAi.howTitle')"
      :text="t('toolsAi.howText')"
    >
      <LandingCards :items="howCards" />
    </LandingSection>

    <LandingSection
      theme="light"
      :eyebrow="t('toolsAi.stepsEyebrow')"
      :title="t('toolsAi.stepsTitle')"
    >
      <LandingSteps :steps="exportSteps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("toolsAi.guideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <LandingSection theme="white" :title="t('toolsAi.faqTitle')">
      <LandingFaq :items="faqItems" />
    </LandingSection>

    <LandingCta
      :title="t('toolsAi.ctaTitle')"
      :cta-text="t('toolsAi.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('toolsAi.ctaNote')"
      @click="scrollToDropzone"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { storeToRefs } from "pinia";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import type { ChatMessage } from "~/composables/useChatTool";
import { analyticsTools } from "~/composables/useAnalytics";
import { useSubscriptionStore } from "~/stores/subscription";
import { buildDigest, restoreNames } from "~/utils/ai/digest";
// WebLLM itself is only fetched inside analyzeLocally, once someone asks.
import {
  LOCAL_DOWNLOAD_GB,
  LOCAL_TRANSCRIPT_CHARS,
  analyzeLocally,
  supportsLocalModel,
} from "~/utils/ai/localModel";
import { analyzeInCloud } from "~/utils/ai/cloudModel";
import {
  AI_LANGUAGES,
  CLOUD_TRANSCRIPT_CHARS,
  type AiLanguage,
  type ChatInsights,
} from "~/functions/src/ai/insights";

type Mode = "local" | "cloud";

const { t, locale } = useI18n();
const localePath = useLocalePath();
const breadcrumbs = useToolBreadcrumbs("toolsHub.toolAiTitle");

useSeoMeta({
  title: () => t("toolsAi.seoTitle"),
  description: () => t("toolsAi.seoDescription"),
  ogTitle: () => t("toolsAi.ogTitle"),
  ogDescription: () => t("toolsAi.ogDescription"),
  ogType: "website",
  ogUrl: "https://whatsanalyze.com/tools/ai-chat-analyzer",
});

const subscriptionStore = useSubscriptionStore();
const { isSubscriptionValid } = storeToRefs(subscriptionStore);

const messages = ref<ChatMessage[] | null>(null);
const insights = ref<ChatInsights | null>(null);
const ranOn = ref<Mode | null>(null);
const running = ref<Mode | null>(null);
const progress = ref(0);
const errorKey = ref<string | null>(null);
const localSupported = ref<boolean | null>(null);

const language = computed<AiLanguage>(() =>
  locale.value in AI_LANGUAGES ? (locale.value as AiLanguage) : "en",
);

async function onChatLoaded(payload: { analysis: unknown }) {
  messages.value = (payload.analysis as { messages: ChatMessage[] }).messages;
  insights.value = null;
  errorKey.value = null;
  localSupported.value = await supportsLocalModel();
  await nextTick();
  document
    .getElementById("ai-choose")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reset() {
  messages.value = null;
  insights.value = null;
  errorKey.value = null;
}

/** Exactly what the cloud would receive, so nobody has to take our word. */
const cloudPreview = computed(() => {
  if (!messages.value) return "";
  try {
    const { digest } = buildDigest(messages.value, CLOUD_TRANSCRIPT_CHARS);
    return JSON.stringify({ ...digest, language: language.value }, null, 2);
  } catch {
    return "";
  }
});

const progressText = computed(() => {
  if (running.value === "cloud") return t("toolsAi.progressCloud");
  if (progress.value < 1)
    return t("toolsAi.progressDownload", {
      pct: Math.round(progress.value * 100),
    });
  return t("toolsAi.progressLocal");
});

async function run(mode: Mode) {
  if (!messages.value) return;
  running.value = mode;
  progress.value = 0;
  errorKey.value = null;
  analyticsTools.aiStarted(mode);
  const startedAt = performance.now();

  try {
    const { digest, names } = buildDigest(
      messages.value,
      mode === "cloud" ? CLOUD_TRANSCRIPT_CHARS : LOCAL_TRANSCRIPT_CHARS,
    );
    let result: ChatInsights;
    if (mode === "cloud") {
      result = await analyzeInCloud(
        useNuxtApp().$functions,
        {
          email: subscriptionStore.getEmail!,
          subscriptionId: subscriptionStore.getSubscriptionId!,
        },
        digest,
        language.value,
      );
    } else {
      result = await analyzeLocally(digest, language.value, (p) => {
        progress.value = p;
      });
    }
    insights.value = restoreNames(result, names);
    ranOn.value = mode;
    analyticsTools.aiFinished(mode, performance.now() - startedAt);
    await nextTick();
    document
      .getElementById("ai-report")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err: any) {
    // Callable errors carry the function's message; everything else is ours.
    const known = [
      "not_subscribed",
      "daily_limit",
      "local_invalid",
      "no_messages",
    ];
    errorKey.value = known.includes(err?.message) ? err.message : mode;
    analyticsTools.error("ai", `${mode}:${err?.message ?? "unknown"}`);
  } finally {
    running.value = null;
  }
}

const modes = computed(() => [
  {
    id: "local" as Mode,
    icon: "mdi-cellphone-lock",
    color: "#21a68d",
    title: t("toolsAi.localTitle"),
    tag: t("toolsAi.localTag"),
    pros: [
      t("toolsAi.localPro1"),
      t("toolsAi.localPro2"),
      t("toolsAi.localPro3"),
    ],
    cons: [
      t("toolsAi.localCon1", {
        gb: LOCAL_DOWNLOAD_GB.toLocaleString(locale.value),
      }),
      t("toolsAi.localCon2"),
      t("toolsAi.localCon3"),
    ],
    button: t("toolsAi.localButton"),
    unavailable:
      localSupported.value === false ? t("toolsAi.localUnsupported") : "",
  },
  {
    id: "cloud" as Mode,
    icon: "mdi-cloud-outline",
    color: "#818cf8",
    title: t("toolsAi.cloudTitle"),
    tag: t("toolsAi.cloudTag"),
    pros: [
      t("toolsAi.cloudPro1"),
      t("toolsAi.cloudPro2"),
      t("toolsAi.cloudPro3"),
    ],
    cons: [t("toolsAi.cloudCon1"), t("toolsAi.cloudCon2")],
    button: t("toolsAi.cloudButton"),
    unavailable: "",
  },
]);

const howCards = computed(() => [
  {
    icon: "mdi-shield-lock-outline",
    title: t("toolsAi.how1Title"),
    text: t("toolsAi.how1Text"),
  },
  {
    icon: "mdi-creation-outline",
    title: t("toolsAi.how2Title"),
    text: t("toolsAi.how2Text"),
  },
  {
    icon: "mdi-account-multiple-outline",
    title: t("toolsAi.how3Title"),
    text: t("toolsAi.how3Text"),
  },
]);

const exportSteps = computed(() => [
  { title: t("toolsAi.step1Title"), text: t("toolsAi.step1Text") },
  { title: t("toolsAi.step2Title"), text: t("toolsAi.step2Text") },
  { title: t("toolsAi.step3Title"), text: t("toolsAi.step3Text") },
]);

const faqItems = computed(() =>
  [1, 2, 3, 4, 5].map((n) => ({
    q: t(`toolsAi.faq${n}Q`),
    a: t(`toolsAi.faq${n}A`),
  })),
);

useToolSchema({
  faqItems,
  app: {
    nameKey: "toolsAi.seoTitle",
    descriptionKey: "toolsAi.seoDescription",
  },
});
</script>

<style scoped lang="scss">
.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1.25rem;
  text-align: left;
}

.mode-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  border-radius: 20px;
  padding: clamp(1.4rem, 3vw, 2rem);
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;

  &--featured {
    border-color: rgba(129, 140, 248, 0.5);
  }

  &__head {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1d1d1f;
  }

  &__tag {
    font-size: 0.72rem;
    color: rgba(29, 29, 31, 0.55);
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.55rem;
    flex: 1;

    li {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      color: #1d1d1f;
      line-height: 1.4;
    }
  }

  &__con {
    color: rgba(29, 29, 31, 0.65) !important;
  }

  &__btn {
    background: #1d1d1f;
    color: #fff;
    font-weight: 600;
    border-radius: 100px;
    padding: 0.8rem 1.4rem;

    &:disabled {
      opacity: 0.5;
      cursor: progress;
    }
  }

  &__note,
  &__fineprint {
    font-size: 0.82rem;
    color: rgba(29, 29, 31, 0.6);
  }
}

.sent-preview {
  margin-top: 1.5rem;
  text-align: left;

  summary {
    cursor: pointer;
    font-weight: 600;
  }

  pre {
    max-height: 320px;
    overflow: auto;
    background: #f5f5f7;
    border-radius: 12px;
    padding: 1rem;
    font-size: 0.75rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
}

.ai-progress {
  margin-top: 1.5rem;
  display: grid;
  gap: 0.5rem;
}

.ai-error {
  margin-top: 1rem;
  color: #c53030;
  display: flex;
  gap: 0.4rem;
  align-items: center;
  justify-content: center;
}

.report {
  text-align: left;
  display: grid;
  gap: 1rem;
}

.report-heading {
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1d1d1f;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1rem;
}

.report-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.2rem 1.4rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  min-width: 0;
  overflow-wrap: anywhere;

  p {
    margin-top: 0.4rem;
    line-height: 1.5;
  }
}

.report-summary p {
  font-size: 1.1rem;
}

.vibe-pill {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  background: rgba(33, 166, 141, 0.12);
  color: #157a67;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 100px;
}

.person-head {
  display: flex;
  gap: 0.7rem;
  align-items: center;

  strong {
    display: block;
  }
}

.person-role {
  font-size: 0.72rem;
  color: rgba(29, 29, 31, 0.55);
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #21a68d;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.highlights {
  padding-left: 2.4rem;
  display: grid;
  gap: 0.5rem;
}

.report-disclaimer {
  font-size: 0.82rem;
  color: rgba(29, 29, 31, 0.55);
}

.report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}
</style>
