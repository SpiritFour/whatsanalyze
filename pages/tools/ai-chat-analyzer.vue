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
      <!-- Optional: who the reader is and what they want to know -->
      <div class="ask">
        <h3 class="ask__title">{{ t("toolsAi.askTitle") }}</h3>
        <div v-if="people.length > 1" class="ask__group">
          <p class="ask__label">{{ t("toolsAi.askMeLabel") }}</p>
          <div class="ask__chips">
            <button
              v-for="person in people"
              :key="person"
              type="button"
              class="chip"
              :class="{ 'chip--on': me === person }"
              @click="me = me === person ? null : person"
            >
              {{ person }}
            </button>
          </div>
        </div>
        <div class="ask__group">
          <p class="ask__label">{{ t("toolsAi.askLabel") }}</p>
          <div class="ask__chips">
            <button
              v-for="preset in presets"
              :key="preset.id"
              type="button"
              class="chip"
              :class="{ 'chip--on': question === preset.id }"
              @click="question = question === preset.id ? null : preset.id"
            >
              {{ preset.label }}
            </button>
          </div>
          <textarea
            v-if="question === 'custom'"
            v-model="customQuestion"
            class="ask__input"
            rows="2"
            :maxlength="MAX_QUESTION_CHARS"
            :placeholder="t('toolsAi.askCustomPlaceholder')"
          />
          <p v-if="askBlocked" class="ask__hint">
            {{ t("toolsAi.askNeedsMe") }}
          </p>
        </div>
      </div>

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
            :disabled="
              running !== null ||
              askBlocked ||
              (mode.id === 'cloud' && allowance?.remaining === 0)
            "
            @click="mode.id === 'local' ? startLocal() : run(mode.id)"
          >
            {{ mode.button }}
          </button>
          <!-- Right under the button that started it, not off-screen -->
          <div v-if="running === mode.id" class="ai-progress" role="status">
            <v-progress-linear
              :model-value="barValue ?? 0"
              :indeterminate="barValue === undefined"
              color="#21a68d"
              rounded
            />
            <p>{{ progressText }}</p>
            <p class="ai-progress__eta">
              {{ t("toolsAi.progressKeepOpen") }}
            </p>
            <p v-if="etaText" class="ai-progress__eta mono-label">
              {{ etaText }}
            </p>
          </div>
          <p
            v-if="errorKey && errorMode === mode.id"
            class="ai-error"
            role="alert"
          >
            <v-icon size="18">mdi-alert-circle-outline</v-icon>
            {{ t(`toolsAi.error_${errorKey}`) }}
          </p>
          <p v-if="mode.crashed" class="ai-error" role="alert">
            <v-icon size="18">mdi-alert-circle-outline</v-icon>
            {{ mode.crashed }}
          </p>
          <!-- Required by the Llama 3.2 licence wherever it is offered -->
          <p
            v-if="mode.id === 'local' && localModel?.id.startsWith('Llama')"
            class="mode-card__fineprint"
          >
            Built with Llama
          </p>
          <!-- Today's allowance, so the limit is no surprise -->
          <p
            v-if="mode.id === 'cloud' && isSubscriptionValid && allowance"
            class="mode-card__allowance"
            :class="{ 'mode-card__allowance--out': !allowance.remaining }"
          >
            {{
              allowance.remaining
                ? t("toolsAi.cloudAllowance", allowance)
                : t("toolsAi.cloudAllowanceOut")
            }}
          </p>
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
    </LandingSection>

    <!-- A model download on a phone that may be on mobile data: ask first -->
    <v-dialog v-model="dataWarning" width="460">
      <div class="data-dialog">
        <v-icon size="32" color="#ff8f00">mdi-alert-circle-outline</v-icon>
        <h3>{{ t("toolsAi.dataTitle", { gb: downloadGb }) }}</h3>
        <p>
          {{
            t(
              meteredReason === "cellular"
                ? "toolsAi.dataTextCellular"
                : "toolsAi.dataTextUnknown",
              { gb: downloadGb },
            )
          }}
        </p>
        <div class="data-dialog__actions">
          <button
            type="button"
            class="mode-card__btn"
            @click="dataWarning = false"
          >
            {{ t("toolsAi.dataCancel") }}
          </button>
          <button
            type="button"
            class="data-dialog__continue"
            @click="confirmDownload"
          >
            {{ t("toolsAi.dataContinue") }}
          </button>
        </div>
      </div>
    </v-dialog>

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
      <div class="report-wrap">
        <AiReport v-if="report" :report="report" />

        <!-- The same encrypted share link as the analyzer's results -->
        <ShareLinkButton :capture="() => report" source="ai_report" />

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
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import AiReport from "~/components/ai/AiReport.vue";
import type { AiReport as AiReportData } from "~/utils/ai/report";
import type { ChatMessage } from "~/composables/useChatTool";
import { analyticsTools } from "~/composables/useAnalytics";
import { useSubscriptionStore } from "~/stores/subscription";
import {
  buildDigest,
  countLines,
  restoreNames,
  tidyInsights,
} from "~/utils/ai/digest";
import { participantMessages } from "~/utils/utils";
// WebLLM itself is only fetched inside analyzeLocally, once someone asks.
import {
  analyzeLocally,
  isModelDownloaded,
  meteredConnection,
  pickLocalModel,
  supportsLocalModel,
  takeCrashedRun,
  localTranscriptChars,
  type AiProgress,
  type LocalModel,
} from "~/utils/ai/localModel";
import {
  analyzeInCloud,
  getCloudAllowance,
  type CloudAllowance,
} from "~/utils/ai/cloudModel";
import {
  AI_LANGUAGES,
  CLOUD_TRANSCRIPT_CHARS,
  MAX_QUESTION_CHARS,
  type AiAsk,
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

const cloudCredentials = () => ({
  email: subscriptionStore.getEmail!,
  subscriptionId: subscriptionStore.getSubscriptionId!,
});

/** Cloud analyses left today; shown on the cloud card for subscribers. */
const allowance = ref<CloudAllowance | null>(null);
async function refreshAllowance() {
  if (!isSubscriptionValid.value) return;
  try {
    allowance.value = await getCloudAllowance(
      useNuxtApp().$functions,
      cloudCredentials(),
    );
  } catch (err) {
    // Only a hint: the analysis itself still enforces the limit.
    console.warn("Could not load the AI allowance:", err);
  }
}
watch(isSubscriptionValid, (valid) => {
  if (valid) void refreshAllowance();
  else allowance.value = null;
});
onMounted(() => void refreshAllowance());

const messages = ref<ChatMessage[] | null>(null);
const insights = ref<ChatInsights | null>(null);
const ranOn = ref<Mode | null>(null);
const running = ref<Mode | null>(null);
const progress = ref<AiProgress | null>(null);
const errorKey = ref<string | null>(null);
const errorMode = ref<Mode | null>(null);
const localModel = ref<LocalModel | null>(null);
const localCrashed = ref(false);

/** Participants by message count, for "which one is you?". */
const people = computed<string[]>(() => {
  if (!messages.value) return [];
  const counts = new Map<string, number>();
  for (const m of participantMessages(messages.value) as ChatMessage[]) {
    counts.set(m.author, (counts.get(m.author) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);
});
const me = ref<string | null>(null);
const question = ref<string | null>(null);
const customQuestion = ref("");

/** Ready-made questions; some only make sense once we know who "I" is. */
const presets = computed(() => [
  ...[
    { id: "into", needsMe: true },
    { id: "arguments", needsMe: false },
    { id: "worried", needsMe: true },
    { id: "gift", needsMe: true },
    { id: "effort", needsMe: false },
    { id: "better", needsMe: false },
  ].map((p) => ({ ...p, label: t(`toolsAi.ask_${p.id}`) })),
  { id: "custom", needsMe: false, label: t("toolsAi.askCustom") },
]);

const askBlocked = computed(
  () =>
    !me.value &&
    people.value.length > 1 &&
    !!presets.value.find((p) => p.id === question.value)?.needsMe,
);

/** The question as the reader sees it, for the top of the report. */
const askedQuestion = computed(() =>
  question.value === "custom"
    ? customQuestion.value.trim()
    : (presets.value.find((p) => p.id === question.value)?.label ?? ""),
);
/** What the report is based on, counted by us rather than said by the model. */
const coverage = ref<{
  total: number;
  from: string;
  to: string;
  read: number;
  parts: number;
} | null>(null);

/** The report as shown, and as a share link carries it. */
const reportQuestion = ref("");
const report = computed<AiReportData | null>(() =>
  insights.value
    ? {
        kind: "ai",
        version: 1,
        insights: insights.value,
        question: reportQuestion.value,
        ranOn: ranOn.value ?? "local",
        coverage: coverage.value,
      }
    : null,
);
const localSupported = ref<boolean | null>(null);
const modelDownloaded = ref(false);
const dataWarning = ref(false);
const meteredReason = ref<"cellular" | "unknown" | null>(null);

const downloadGb = computed(() =>
  ((localModel.value?.downloadMb ?? 0) / 1000).toLocaleString(locale.value, {
    maximumFractionDigits: 1,
  }),
);

const language = computed<AiLanguage>(() =>
  locale.value in AI_LANGUAGES ? (locale.value as AiLanguage) : "en",
);

async function onChatLoaded(payload: { analysis: unknown }) {
  messages.value = (payload.analysis as { messages: ChatMessage[] }).messages;
  insights.value = null;
  errorKey.value = null;
  localSupported.value = await supportsLocalModel();
  if (localSupported.value) {
    localModel.value = await pickLocalModel();
    modelDownloaded.value = isModelDownloaded(localModel.value);
    localCrashed.value = takeCrashedRun();
    if (localCrashed.value) analyticsTools.error("ai", "local:crashed");
  }
  await nextTick();
  document
    .getElementById("ai-choose")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reset() {
  messages.value = null;
  me.value = null;
  question.value = null;
  customQuestion.value = "";
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

const formatDuration = (seconds: number) => {
  const [value, unit] =
    seconds < 60
      ? [Math.max(5, Math.ceil(seconds / 5) * 5), "second"]
      : [Math.ceil(seconds / 60), "minute"];
  return new Intl.NumberFormat(locale.value, {
    style: "unit",
    unit,
    unitDisplay: "long",
  }).format(value);
};

/**
 * One bar for the whole on-device run: the download, then each part read,
 * then writing the report. Undefined means "no measure", so it animates.
 */
const barValue = computed<number | undefined>(() => {
  const p = progress.value;
  if (running.value !== "local" || !p) return undefined;
  if (p.phase === "download")
    return p.progress < 1 ? p.progress * 100 : undefined;
  if (p.phase === "read") return (p.done / (p.total + 1)) * 100;
  return p.total > 1 ? (p.total / (p.total + 1)) * 100 : undefined;
});

const progressText = computed(() => {
  const p = progress.value;
  if (running.value === "cloud") return t("toolsAi.progressCloud");
  if (p?.phase === "download" && p.progress < 1) {
    if (modelDownloaded.value) return t("toolsAi.progressLoading");
    const mb = (n: number) => Math.round(n).toLocaleString(locale.value);
    const total = localModel.value?.downloadMb ?? 0;
    return t("toolsAi.progressDownload", {
      done: mb(p.progress * total),
      total: mb(total),
    });
  }
  if (p?.phase === "read") {
    return t("toolsAi.progressRead", { part: p.done + 1, total: p.total });
  }
  if (p?.phase === "write" && p.total > 1) return t("toolsAi.progressWrite");
  return t("toolsAi.progressLocal");
});

/** Time left at the rate so far; held back until the rate means something. */
const etaText = computed(() => {
  const p = progress.value;
  if (running.value !== "local" || !p) return "";
  if (p.phase === "download") {
    if (p.progress >= 1) return "";
    if (p.progress < 0.02 || p.elapsed < 3)
      return t("toolsAi.progressEtaPending");
    const seconds = (p.elapsed * (1 - p.progress)) / p.progress;
    return t("toolsAi.progressEta", { time: formatDuration(seconds) });
  }
  if (p.phase === "read") {
    if (p.done === 0) return t("toolsAi.progressEtaPending");
    // The parts left, plus the report, which takes about as long as a part.
    const perPart = p.elapsed / p.done;
    const seconds = perPart * (p.total - p.done + 1);
    return t("toolsAi.progressEta", { time: formatDuration(seconds) });
  }
  return "";
});

/** On-device on a phone that may be on mobile data: confirm the download. */
function startLocal() {
  meteredReason.value = modelDownloaded.value ? null : meteredConnection();
  if (meteredReason.value) {
    dataWarning.value = true;
    analyticsTools.aiDataWarning(meteredReason.value);
  } else {
    run("local");
  }
}

function confirmDownload() {
  dataWarning.value = false;
  run("local");
}

async function run(mode: Mode) {
  if (!messages.value) return;
  running.value = mode;
  progress.value = null;
  errorKey.value = null;
  errorMode.value = null;
  localCrashed.value = false;
  analyticsTools.aiStarted(mode, question.value ?? "none");
  // Keep the screen on: a phone that dims and locks pauses the on-device AI.
  const wakeLock = await (navigator as any).wakeLock
    ?.request("screen")
    .catch(() => null);
  // On a phone the button sits near the bottom edge; bring the progress up.
  nextTick(() =>
    document
      .querySelector(".ai-progress")
      ?.scrollIntoView({ behavior: "smooth", block: "center" }),
  );
  const startedAt = performance.now();

  try {
    const { digest, names, anonymize } = buildDigest(
      messages.value,
      mode === "cloud"
        ? CLOUD_TRANSCRIPT_CHARS
        : localTranscriptChars(localModel.value!),
    );
    const alias = Object.keys(names).find((a) => names[a] === me.value);
    const asked = askedQuestion.value
      ? anonymize(askedQuestion.value).slice(0, MAX_QUESTION_CHARS)
      : undefined;
    const ask: AiAsk | undefined =
      alias || asked ? { me: alias, question: asked } : undefined;
    let result: ChatInsights;
    let read = countLines(digest.transcript);
    let parts = 1;
    if (mode === "cloud") {
      const cloud = await analyzeInCloud(
        useNuxtApp().$functions,
        cloudCredentials(),
        digest,
        language.value,
        ask,
      );
      result = cloud.insights;
      allowance.value = cloud.allowance;
    } else {
      const local = await analyzeLocally(
        localModel.value!,
        digest,
        language.value,
        (p) => {
          progress.value = p;
        },
        ask,
      );
      result = local.insights;
      read = local.parts.reduce((sum, part) => sum + countLines(part), 0);
      parts = local.parts.length;
    }
    if (mode === "local") modelDownloaded.value = true;
    reportQuestion.value = askedQuestion.value;
    insights.value = tidyInsights(restoreNames(result, names));
    coverage.value = {
      total: digest.totalMessages,
      from: digest.firstDate,
      to: digest.lastDate,
      read,
      parts,
    };
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
    errorMode.value = mode;
    if (err?.message === "daily_limit") {
      allowance.value = { remaining: 0, limit: allowance.value?.limit ?? 10 };
    }
    analyticsTools.error("ai", `${mode}:${err?.message ?? "unknown"}`);
  } finally {
    wakeLock?.release().catch(() => {});
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
      ...(modelDownloaded.value ? [t("toolsAi.localDownloaded")] : []),
    ],
    cons: [
      ...(modelDownloaded.value
        ? []
        : [t("toolsAi.localCon1", { gb: downloadGb.value })]),
      t("toolsAi.localCon2"),
      t("toolsAi.localCon3"),
    ],
    button: t("toolsAi.localButton"),
    unavailable:
      localSupported.value === false ? t("toolsAi.localUnsupported") : "",
    crashed: localCrashed.value ? t("toolsAi.localCrashed") : "",
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
    crashed: "",
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
  [1, 2, 3, 4, 5, 6].map((n) => ({
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

  &__allowance {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4f46e5;

    &--out {
      color: #b45309;
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

.ai-progress__eta {
  font-size: 0.78rem;
  color: rgba(29, 29, 31, 0.55);
}

.data-dialog {
  background: #fff;
  border-radius: 20px;
  padding: 1.8rem;
  display: grid;
  gap: 0.8rem;
  color: #1d1d1f;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
  }

  p {
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 0.5rem;
  }

  &__continue {
    padding: 0.8rem 1.4rem;
    border-radius: 100px;
    font-weight: 600;
    color: #1d1d1f;
    border: 1px solid rgba(29, 29, 31, 0.2);
  }
}

.ai-error {
  margin-top: 1rem;
  color: #c53030;
  display: flex;
  gap: 0.4rem;
  align-items: center;
  justify-content: center;
}

.ask {
  text-align: left;
  background: #fff;
  border-radius: 20px;
  padding: clamp(1.2rem, 3vw, 1.6rem);
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
  display: grid;
  gap: 1rem;

  &__title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1d1d1f;
  }

  &__group {
    display: grid;
    gap: 0.5rem;
  }

  &__label {
    font-size: 0.9rem;
    color: rgba(29, 29, 31, 0.7);
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__input {
    width: 100%;
    border: 1px solid rgba(29, 29, 31, 0.2);
    border-radius: 12px;
    padding: 0.7rem 0.9rem;
    font: inherit;
    color: #1d1d1f;
    background: #fff;
  }

  &__hint {
    font-size: 0.85rem;
    color: #b45309;
  }
}

.chip {
  border: 1px solid rgba(29, 29, 31, 0.18);
  border-radius: 100px;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  color: #1d1d1f;
  background: #fff;
  overflow-wrap: anywhere;

  &--on {
    background: #1d1d1f;
    border-color: #1d1d1f;
    color: #fff;
  }
}

.report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.report-wrap {
  text-align: left;
  display: grid;
  gap: 1.5rem;
}
</style>
