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
        <ToolDropzone
          ref="dropzone"
          tool-type="ai"
          @analyzed="onChatLoaded"
          @reset="reset"
        />
      </div>
    </LandingHero>

    <!-- Where to run it: the anonymized cloud AI first, the device as the
         alternative, with the trade-offs of both spelled out -->
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
          <p v-if="sampleNeedsOwnChat" class="ask__hint">
            {{ t("toolsAi.sampleCustom") }}
          </p>
        </div>
        <!-- What the chat doesn't show. Not for the sample: its readings
             were made in advance, without any. A phone keyboard's
             dictation covers saying it rather than typing it. -->
        <div v-if="!isSample" class="ask__group">
          <label class="ask__label" for="ai-background">
            {{ t("toolsAi.askBackgroundLabel") }}
          </label>
          <textarea
            id="ai-background"
            v-model="background"
            class="ask__input"
            rows="2"
            :maxlength="MAX_BACKGROUND_CHARS"
            :placeholder="t('toolsAi.askBackgroundPlaceholder')"
            aria-describedby="ai-background-note"
          />
          <p id="ai-background-note" class="ask__note">
            {{ t("toolsAi.askBackgroundNote") }}
          </p>
        </div>
      </div>

      <div class="mode-grid">
        <div
          v-for="mode in modes"
          :key="mode.id"
          class="mode-card"
          :class="
            mode.id === 'cloud' ? 'mode-card--featured' : 'mode-card--alt'
          "
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
          <button
            v-else
            type="button"
            class="mode-card__btn"
            :class="{ 'mode-card__btn--secondary': mode.id === 'local' }"
            :disabled="
              running !== null ||
              askBlocked ||
              (mode.id === 'local' && !localModel) ||
              (mode.id === 'cloud' &&
                (sampleReadings
                  ? sampleNeedsOwnChat
                  : allowance?.remaining === 0))
            "
            @click="mode.id === 'local' ? startLocal() : run(mode.id)"
          >
            {{ mode.button }}
          </button>
          <!-- The sample's readings were made in advance: free, and the
               visitor's own free preview stays theirs -->
          <p
            v-if="mode.id === 'cloud' && sampleReadings"
            class="mode-card__sample"
          >
            {{ t("toolsAi.sampleNote") }}
          </p>
          <!-- Not subscribed: the button above runs the free preview -->
          <NuxtLink
            v-if="mode.id === 'cloud' && !isSubscriptionValid && !cloudFallback"
            :to="subscribeLink"
            class="mode-card__link"
            @click="analyticsTools.ctaClick('ai', 'subscribe')"
          >
            {{ t("toolsAi.cloudSubscribe") }}
          </NuxtLink>
          <!-- Right under the button that started it, not off-screen -->
          <div v-if="running === mode.id" class="ai-progress" role="status">
            <v-progress-linear
              :model-value="barValue ?? 0"
              :indeterminate="barValue === undefined"
              color="#21a68d"
              rounded
            />
            <p>{{ progressText }}</p>
            <!-- The sample's reading is already made: nothing to pause -->
            <p v-if="!sampleReadings" class="ai-progress__eta">
              {{ t("toolsAi.progressKeepOpen") }}
            </p>
            <p v-if="etaText" class="ai-progress__eta mono-label">
              {{ etaText }}
            </p>
          </div>
          <p
            v-if="
              errorKey &&
              errorMode === mode.id &&
              !(mode.id === 'cloud' && cloudFallback)
            "
            class="ai-error"
            role="alert"
          >
            <v-icon size="18">mdi-alert-circle-outline</v-icon>
            {{ t(`toolsAi.error_${errorKey}`) }}
          </p>
          <!-- No cloud run right now: not a dead end, the device can still -->
          <div
            v-if="mode.id === 'cloud' && cloudFallback"
            class="ai-fallback"
            role="alert"
          >
            <p class="ai-fallback__text">
              <v-icon size="18" color="#b45309">mdi-information-outline</v-icon>
              {{ t(cloudFallback) }}
            </p>
            <p v-if="localModel">{{ t("toolsAi.fallbackLocal") }}</p>
            <div class="ai-fallback__actions">
              <button
                v-if="localModel"
                type="button"
                class="mode-card__btn"
                :disabled="running !== null || askBlocked"
                @click="startLocal"
              >
                {{ t("toolsAi.localButton") }}
              </button>
              <NuxtLink
                v-if="!isSubscriptionValid"
                :to="subscribeLink"
                class="mode-card__link"
                @click="analyticsTools.ctaClick('ai', 'subscribe')"
              >
                {{ t("toolsAi.cloudSubscribe") }}
              </NuxtLink>
            </div>
          </div>
          <p v-if="mode.crashed" class="ai-error" role="alert">
            <v-icon size="18">mdi-alert-circle-outline</v-icon>
            {{ mode.crashed }}
          </p>
          <!-- On-device failed: the cloud is a click away, not a card away -->
          <div v-if="mode.offerCloud" class="mode-card__fallback">
            <button
              type="button"
              class="mode-card__btn"
              :disabled="running !== null || askBlocked || cloudSpent"
              @click="run('cloud', 'fallback')"
            >
              {{
                isSubscriptionValid
                  ? t("toolsAi.fallbackCloud")
                  : t("toolsAi.fallbackPreview")
              }}
            </button>
            <p class="mode-card__fineprint">{{ t("toolsAi.cloudConsent") }}</p>
          </div>
          <!-- Required by the Llama 3.2 licence wherever it is offered -->
          <p
            v-if="mode.id === 'local' && localModel?.id.startsWith('Llama')"
            class="mode-card__fineprint"
          >
            Built with Llama
          </p>
          <!-- Today's allowance, so the limit is no surprise; none left is
               the fallback above -->
          <p
            v-if="
              mode.id === 'cloud' && isSubscriptionValid && allowance?.remaining
            "
            class="mode-card__allowance"
          >
            {{ t("toolsAi.cloudAllowance", allowance) }}
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
          <button
            type="button"
            class="data-dialog__continue"
            :disabled="askBlocked || cloudSpent"
            @click="cloudInstead"
          >
            {{ t("toolsAi.dataUseCloud") }}
          </button>
        </div>
        <p class="data-dialog__fineprint">{{ t("toolsAi.cloudConsent") }}</p>
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
        <!-- The sample's reading: say it was made in advance, and that the
             visitor's own chat is next -->
        <div v-if="sampleReadings && ranOn === 'cloud'" class="sample-note">
          <p>{{ t("toolsAi.sampleReport") }}</p>
          <button type="button" class="mode-card__btn" @click="tryOwnChat">
            {{ t("toolsAi.sampleOwnChat") }}
          </button>
        </div>
        <AiReport v-if="report" :report="report" />

        <!-- A reading about the two of them, not one side: offered to send
             to the other person, who can then get their own -->
        <AiSendReading
          v-if="report && !isSample && canSendReading(report)"
          :key="report.insights.summary"
          :report="report"
          :people="people"
          :me="me"
        />

        <!-- The same encrypted share link as the analyzer's results -->
        <ShareLinkButton :capture="() => report" source="ai_report" />

        <!-- Keep talking: follow-up questions and reply help. After a free
             preview it runs in the cloud on a few free replies a day. -->
        <AiCoach
          v-if="messages && ranOn && (ranOn === 'cloud' || localModel)"
          :key="report?.insights.summary"
          :chat="messages"
          :mode="ranOn"
          :language="language"
          :local-model="localModel"
          :me="me"
          :summary="insights.summary"
          :background="background"
          :free="!!locked"
          :sample="
            sampleReadings && ranOn === 'cloud' ? sampleReadings.coach : null
          "
          :initial-kind="coachFirst ? 'reply' : 'ask'"
          @allowance="allowance = $event"
        />

        <!-- After the sample: the visitor's own chat, one tap from here -->
        <div
          v-if="sampleReadings && ranOn === 'cloud'"
          id="sample-yours"
          class="sample-yours"
        >
          <h3 class="sample-yours__title">
            {{ t("toolsAi.sampleYoursTitle") }}
          </h3>
          <p>{{ t("toolsAi.sampleYoursText") }}</p>
          <button type="button" class="mode-card__btn" @click="chooseOwnChat">
            {{ t("toolsAi.sampleYoursButton") }}
          </button>
          <NuxtLink
            :to="localePath('how-to-export-your-whatsapp-chat')"
            class="mode-card__link"
            @click="analyticsTools.ctaClick('ai_sample', 'export_guide')"
          >
            {{ t("toolsAi.sampleYoursGuide") }} →
          </NuxtLink>
        </div>

        <!-- A saved chat's earlier readings, with their dates -->
        <LibraryReadings
          v-if="readings.length > 1"
          :readings="readings"
          :current="readingId"
          @select="showReading"
        />

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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { storeToRefs } from "pinia";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import AiReport from "~/components/ai/AiReport.vue";
import AiCoach from "~/components/ai/AiCoach.vue";
import AiSendReading from "~/components/ai/AiSendReading.vue";
import type { AiReport as AiReportData } from "~/utils/ai/report";
import type { ChatMessage } from "~/composables/useChatTool";
import { analyticsTools, type AiSource } from "~/composables/useAnalytics";
import { useSubscriptionStore } from "~/stores/subscription";
import {
  buildDigest,
  countLines,
  readerText,
  restoreNames,
  tidyInsights,
} from "~/utils/ai/digest";
import { participantMessages } from "~/utils/utils";
import { AI_QUESTIONS } from "~/utils/ai/questions";
import { canSendReading, takeSentOpened } from "~/utils/ai/sendReading";
import {
  SAMPLE_READING_MS,
  loadSampleReadings,
  matchesSample,
  sampleReadingKey,
  type SampleReadings,
} from "~/utils/ai/sample";
// WebLLM itself is only fetched inside analyzeLocally, once someone asks.
import {
  analyzeLocally,
  checkLocalModel,
  isModelDownloaded,
  meteredConnection,
  smallerModel,
  stopLocalModel,
  takeCrashedRun,
  reportLocalFailure,
  localTranscriptChars,
  type AiProgress,
  type LocalModel,
  type LocalUnavailable,
} from "~/utils/ai/localModel";
import { localErrorKey } from "~/utils/ai/localErrors";
import { callableErrorCode } from "~/utils/ai/cloudErrors";
import {
  analyzeInCloud,
  getCloudAllowance,
  type CloudAllowance,
} from "~/utils/ai/cloudModel";
import {
  AI_LANGUAGES,
  CLOUD_TRANSCRIPT_CHARS,
  PREVIEW_TRANSCRIPT_CHARS,
  MAX_BACKGROUND_CHARS,
  MAX_QUESTION_CHARS,
  type AiAsk,
  type AiLanguage,
  type ChatInsights,
} from "~/functions/src/ai/insights";
import type { PreviewLocked } from "~/functions/src/ai/preview";
import { useLibrary, type SavedReading } from "~/composables/useLibrary";
import {
  forgetLocalAiFailure,
  rememberLocalAiFailure,
} from "~/utils/library/device";

type Mode = "local" | "cloud";

const { t, locale } = useI18n();
const localePath = useLocalePath();
const subscribeLink = useSubscribeLink();
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
/**
 * What the reader says the chat doesn't show ("we broke up in July"), as
 * typed: anonymized only on its way to the model (askFor), and the coach's
 * too. It belongs to this chat, so another chat starts without it.
 */
const background = ref("");

/** Ready-made questions; some only make sense once we know who "I" is. */
const presets = computed(() => [
  ...AI_QUESTIONS.map((p) => ({ ...p, label: t(`toolsAi.ask_${p.id}`) })),
  { id: "custom", needsMe: false, label: t("toolsAi.askCustom") },
]);

// Arriving from the analyzer's "Ask AI about this chat" card, or from a
// landing page with its question picked. The page is prerendered and
// hydrates with the route it was rendered with, which had no query, so
// ?ask= and ?source= are read once it is mounted: read in setup, every
// question a link picked was dropped.
const router = useRouter();
let source: AiSource = "tool";
/**
 * ?coach=reply, from "What should I reply?": the reader came for reply help,
 * so once there's a reading the page goes to the coach, set to reply.
 */
const coachFirst = ref(false);
onMounted(() => {
  const {
    ask,
    source: from,
    coach,
    try: attempt,
  } = router.currentRoute.value.query;
  // "shared": from a reading someone sent them (pages/s.vue)
  if (from === "results" || from === "shared") source = from;
  coachFirst.value = coach === "reply";
  if (!question.value && presets.value.some((p) => p.id === ask)) {
    question.value = ask as string;
  }
  // ?try=sample, from a sent reading's "Try the sample first"
  if (attempt === "sample") dropzone.value?.loadSample();
});

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

/**
 * Who the reader is, what they ask and what they add, as the model gets it:
 * in the chat's placeholders, and anonymized like the chat (buildDigest).
 */
function askFor(
  names: Record<string, string>,
  anonymize: (_text: string) => string,
): AiAsk | undefined {
  const ask: AiAsk = {
    me: Object.keys(names).find((alias) => names[alias] === me.value),
    question: readerText(anonymize, askedQuestion.value, MAX_QUESTION_CHARS),
    background: readerText(anonymize, background.value, MAX_BACKGROUND_CHARS),
  };
  return ask.me || ask.question || ask.background ? ask : undefined;
}
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
/** What it was asked, for whether it can be sent (utils/ai/sendReading.js). */
const reportAsked = ref<AiReportData["asked"]>(null);
/** Set when the report is the free cloud preview. */
const locked = ref<PreviewLocked | null>(null);
// Back from subscribing with the preview still shown: get the full report.
watch(
  // Not after an error: that would retry in a loop. Not for an earlier
  // reading picked from a saved chat's history, either: that's a look back.
  () =>
    !!locked.value &&
    isSubscriptionValid.value &&
    !running.value &&
    !errorKey.value &&
    !lookingBack.value,
  (upgrade) => {
    if (!upgrade) return;
    // Back to the cards, where the progress and any error show.
    insights.value = null;
    void run("cloud");
  },
);
const report = computed<AiReportData | null>(() =>
  insights.value
    ? {
        kind: "ai",
        version: 1,
        insights: insights.value,
        question: reportQuestion.value,
        asked: reportAsked.value,
        ranOn: ranOn.value ?? "local",
        coverage: coverage.value,
        locked: locked.value,
      }
    : null,
);
/** Why this device can't run the on-device AI, once checked; null if it can. */
const localUnavailable = ref<LocalUnavailable | null>(null);
/** The model it would have run there: how big a download it can't take. */
const unavailableModel = ref<LocalModel | null>(null);
const modelDownloaded = ref(false);
/** Today's cloud analyses are used up: nothing to fall back to. */
const cloudSpent = computed(
  () => isSubscriptionValid.value && allowance.value?.remaining === 0,
);
const dataWarning = ref(false);
const meteredReason = ref<"cellular" | "unknown" | null>(null);

const downloadGb = computed(() =>
  (
    ((localModel.value ?? unavailableModel.value)?.downloadMb ?? 0) / 1000
  ).toLocaleString(locale.value, {
    maximumFractionDigits: 1,
  }),
);

const language = computed<AiLanguage>(() =>
  locale.value in AI_LANGUAGES ? (locale.value as AiLanguage) : "en",
);

/** The sample chat is on screen ("Try With Sample Chat"). */
const isSample = ref(false);
/**
 * Its readings, made in advance in this language (utils/ai/sample.ts): while
 * they're here, the cloud card shows those instead of asking the cloud.
 * Shallow: they never change, and a reading is copied before it's shown,
 * which a reactive proxy can't be.
 */
const sampleReadings = shallowRef<SampleReadings | null>(null);
/** Looking them up, so a quick click waits rather than asking the cloud. */
let sampleLookup: Promise<void> = Promise.resolve();
function findSampleReadings() {
  sampleReadings.value = null;
  const chat = messages.value;
  if (!isSample.value || !chat) return;
  sampleLookup = loadSampleReadings(language.value).then((readings) => {
    if (!readings || messages.value !== chat) return;
    const { digest } = buildDigest(chat, CLOUD_TRANSCRIPT_CHARS);
    if (matchesSample(readings, digest)) sampleReadings.value = readings;
  });
}
watch(language, findSampleReadings);
/** A question of the visitor's own: the sample has no reading for it. */
const sampleNeedsOwnChat = computed(
  () => !!sampleReadings.value && question.value === "custom",
);

// A saved chat keeps every reading with it (composables/useLibrary.ts), so
// coming back, even days later, shows the last one and never runs it again.
const library = useLibrary();
/** The saved chat on screen, if it is one. */
const savedId = ref<string | null>(null);
/** Its readings, newest first, and which of them is shown. */
const readings = ref<SavedReading[]>([]);
const readingId = ref<string | null>(null);

function showReport(r: AiReportData) {
  insights.value = r.insights;
  reportQuestion.value = r.question;
  reportAsked.value = r.asked ?? null;
  ranOn.value = r.ranOn;
  coverage.value = r.coverage ?? null;
  locked.value = r.locked ?? null;
}

function showReading(reading: SavedReading) {
  readingId.value = reading.id;
  showReport(reading.report);
}
/** An earlier reading than the newest is on screen. */
const lookingBack = computed(
  () => !!readingId.value && readingId.value !== readings.value[0]?.id,
);

// Which participant is "me", so the AI never asks twice.
watch(me, (name) => {
  if (savedId.value) void library.setMe(savedId.value, name);
});

// "Don't keep" or "Forget" while the reading is on screen: from here on it
// is an unsaved chat, whose reading the tab keeps.
watch(
  () =>
    !!savedId.value && library.ready.value && !library.chatById(savedId.value),
  (gone) => {
    if (!gone) return;
    savedId.value = null;
    readings.value = [];
    readingId.value = null;
    if (insights.value) saveReport();
  },
);

// The last report of a chat that isn't saved, per tab, so leaving the page
// and coming back doesn't lose it, and a free preview isn't spent twice on
// the same chat.
const REPORT_KEY = "ai-report";

function saveReport() {
  if (savedId.value && report.value) {
    void library.addReading(savedId.value, report.value).then((reading) => {
      if (!reading) return;
      readings.value = [reading, ...readings.value];
      readingId.value = reading.id;
    });
    return;
  }
  try {
    sessionStorage.setItem(
      REPORT_KEY,
      JSON.stringify({
        chat: chatFingerprint({ chatObject: messages.value }),
        report: report.value,
      }),
    );
  } catch {
    // Storage blocked or full: the report just won't survive a reload.
  }
}

async function restoreReport() {
  const chat = messages.value;
  savedId.value = await library.savedIdFor(chat);
  if (messages.value !== chat) return;
  readings.value = [];
  readingId.value = null;
  if (savedId.value) {
    const remembered = library.chatById(savedId.value)?.me;
    if (remembered && people.value.includes(remembered)) me.value = remembered;
    readings.value = await library.readings(savedId.value);
    if (readings.value.length) showReading(readings.value[0]);
    return;
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(REPORT_KEY) ?? "null");
    if (saved?.chat !== chatFingerprint({ chatObject: messages.value })) return;
    showReport(saved.report);
  } catch {
    // Unreadable or blocked: start without it.
  }
}

/**
 * A free preview this saved chat already had: shown again rather than
 * spending another, e.g. after picking an earlier on-device reading.
 */
function showKeptPreview() {
  const preview = readings.value.find((r) => r.report.locked);
  if (preview) showReading(preview);
  return !!preview;
}

/** A reading is on screen: show it, or the coach for whoever came for it. */
function showWhereNext() {
  const target = coachFirst.value
    ? document.querySelector(".coach")
    : document.getElementById("ai-report");
  (target ?? document.getElementById("ai-report"))?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

async function onChatLoaded(payload: { analysis: unknown; sample?: boolean }) {
  messages.value = (payload.analysis as { messages: ChatMessage[] }).messages;
  insights.value = null;
  errorKey.value = null;
  background.value = "";
  isSample.value = !!payload.sample;
  findSampleReadings();
  await restoreReport();
  // requestDevice can take a moment on some drivers: scroll first.
  void nextTick(() =>
    insights.value
      ? showWhereNext()
      : document
          .getElementById("ai-choose")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
  // Before anyone clicks: a device that can't run it is pointed at the cloud
  // now, not after a download (utils/ai/localCheck.js).
  const check = await checkLocalModel();
  localUnavailable.value = check.unavailable;
  localModel.value = check.unavailable ? null : check.model;
  unavailableModel.value = check.unavailable ? check.model : null;
  if (check.unavailable) analyticsTools.aiLocalUnavailable(check.unavailable);
  const crash = takeCrashedRun();
  if (crash) {
    analyticsTools.error("ai", "local:crashed");
    analyticsTools.aiFailed("local", "crashed", crash.phase);
    reportLocalFailure("crashed", crash.model, crash.phase);
    rememberLocalAiFailure({ reason: "crashed", ...crash });
  }
  if (localModel.value) {
    localCrashed.value = !!crash;
    // The tab died running the 2B model: next time, the 1B one.
    if (crash?.model === localModel.value.id) {
      localModel.value = smallerModel(localModel.value) ?? localModel.value;
    }
    modelDownloaded.value = isModelDownloaded(localModel.value);
  }
}

function reset() {
  messages.value = null;
  isSample.value = false;
  sampleReadings.value = null;
  me.value = null;
  question.value = null;
  customQuestion.value = "";
  background.value = "";
  insights.value = null;
  errorKey.value = null;
}

/** The digest the cloud would get; built once per chat, not per keystroke. */
const previewDigest = computed(() => {
  if (!messages.value) return null;
  try {
    return buildDigest(
      messages.value,
      isSubscriptionValid.value
        ? CLOUD_TRANSCRIPT_CHARS
        : PREVIEW_TRANSCRIPT_CHARS,
    );
  } catch {
    return null;
  }
});
/**
 * Exactly what the cloud would receive, so nobody has to take our word:
 * the reader's question and background included, as anonymized.
 */
const cloudPreview = computed(() => {
  if (!previewDigest.value) return "";
  const { digest, names, anonymize } = previewDigest.value;
  return JSON.stringify(
    { ...digest, language: language.value, ask: askFor(names, anonymize) },
    null,
    2,
  );
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
  if (running.value === "cloud") {
    return sampleReadings.value
      ? t("toolsAi.progressSample")
      : t("toolsAi.progressCloud");
  }
  if (p?.phase === "download" && p.retry) return t("toolsAi.progressRetry");
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

/** No download at all: the anonymized cloud run instead. */
function cloudInstead() {
  dataWarning.value = false;
  run("cloud", "fallback");
}

// Closed without "continue" (cancel, backdrop, Esc): run() hasn't started.
watch(dataWarning, (open) => {
  if (!open && running.value === null) {
    analyticsTools.aiAbandoned("local", "data_warning");
  }
});

/** Set by a run in progress: reports it abandoned when the page goes. */
let leaving: (() => void) | null = null;
let unmounted = false;
onBeforeUnmount(() => {
  // Leaving for another page of the site fires no pagehide.
  unmounted = true;
  leaving?.();
  stopLocalModel();
});

/** `via` "fallback": the cloud, offered when the on-device AI couldn't. */
async function run(mode: Mode, via?: "fallback") {
  if (!messages.value) return;
  if (mode === "cloud" && isSample.value) await sampleLookup;
  if (mode === "cloud" && sampleReadings.value) return showSampleReading(via);
  if (mode === "cloud" && !isSubscriptionValid.value && showKeptPreview()) {
    return;
  }
  running.value = mode;
  progress.value = null;
  errorKey.value = null;
  errorMode.value = null;
  localCrashed.value = false;
  const preview = mode === "cloud" && !isSubscriptionValid.value;
  const trackedMode = preview ? "preview" : mode;
  const startedAt = performance.now();
  const from = via ?? source;
  analyticsTools.aiStarted(
    trackedMode,
    question.value ?? "none",
    from,
    !!background.value.trim(),
  );
  const phase = () =>
    mode === "cloud" ? "cloud" : (progress.value?.phase ?? "download");
  // Leaving mid-run used to vanish from the funnel: started, never finished.
  const onLeave = () =>
    analyticsTools.aiAbandoned(
      trackedMode,
      phase(),
      performance.now() - startedAt,
    );
  window.addEventListener("pagehide", onLeave);
  leaving = onLeave;
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

  try {
    const { digest, names, anonymize } = buildDigest(
      messages.value,
      preview
        ? PREVIEW_TRANSCRIPT_CHARS
        : mode === "cloud"
          ? CLOUD_TRANSCRIPT_CHARS
          : localTranscriptChars(localModel.value!),
    );
    const ask = askFor(names, anonymize);
    let result: ChatInsights;
    let read = countLines(digest.transcript);
    let parts = 1;
    if (mode === "cloud") {
      const cloud = await analyzeInCloud(
        useNuxtApp().$functions,
        preview ? null : cloudCredentials(),
        digest,
        language.value,
        ask,
      );
      result = cloud.insights;
      if (cloud.allowance) allowance.value = cloud.allowance;
      locked.value = cloud.locked;
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
      locked.value = null;
      read = local.parts.reduce((sum, part) => sum + countLines(part), 0);
      parts = local.parts.length;
    }
    if (mode === "local") {
      modelDownloaded.value = true;
      // It works here after all: stop steering this browser away from it.
      forgetLocalAiFailure();
    }
    reportQuestion.value = askedQuestion.value;
    reportAsked.value = {
      preset: askedQuestion.value ? question.value : null,
      // Told who the reader is, the AI wrote to them as "you".
      toReader: !!ask?.me,
    };
    insights.value = tidyInsights(restoreNames(result, names));
    coverage.value = {
      total: digest.totalMessages,
      from: digest.firstDate,
      to: digest.lastDate,
      read,
      parts,
    };
    ranOn.value = mode;
    saveReport();
    // Already counted as abandoned; the report is kept for coming back.
    if (unmounted) return;
    analyticsTools.aiFinished(trackedMode, performance.now() - startedAt, from);
    // Their own reading, after opening one someone sent them
    const sentQuestion = takeSentOpened();
    if (sentQuestion)
      analyticsTools.aiShareConverted(trackedMode, sentQuestion);
    await nextTick();
    showWhereNext();
  } catch (err: any) {
    const message = String(err?.message ?? "unknown");
    // The page went mid-run and stopped the model: abandoned, not failed.
    if (unmounted || message === "stopped") return;
    // Callable errors carry the function's message; everything else is ours.
    const known = [
      "not_subscribed",
      "daily_limit",
      "preview_used",
      "preview_cap",
      "local_invalid",
      "no_messages",
    ];
    const code = callableErrorCode(message);
    errorKey.value = known.includes(code)
      ? code
      : mode === "local"
        ? localErrorKey(message)
        : mode;
    errorMode.value = mode;
    if (mode === "local" && code !== "no_messages") {
      reportLocalFailure(
        message,
        localModel.value?.id,
        phase(),
        err?.finish ? { finish: err.finish, chars: err.chars } : undefined,
      );
      // An answer that wasn't valid says nothing about the device.
      if (errorKey.value !== "local_invalid") {
        rememberLocalAiFailure({
          reason: errorKey.value,
          model: localModel.value?.id,
          phase: phase(),
        });
      }
      // Out of GPU memory on the 2B model: "try again" runs the 1B one.
      const smaller =
        errorKey.value === "local_memory" && localModel.value
          ? smallerModel(localModel.value)
          : null;
      if (smaller) {
        localModel.value = smaller;
        modelDownloaded.value = isModelDownloaded(smaller);
      }
    }
    if (code === "daily_limit") {
      allowance.value = { remaining: 0, limit: allowance.value?.limit ?? 10 };
    }
    analyticsTools.error("ai", `${mode}:${message}`);
    analyticsTools.aiFailed(trackedMode, message, phase());
  } finally {
    leaving = null;
    window.removeEventListener("pagehide", onLeave);
    wakeLock?.release().catch(() => {});
    running.value = null;
  }
}

/**
 * The sample chat's reading for the question asked, made in advance: shown
 * after a wait like the real one, without asking the cloud, so trying it
 * costs nothing and leaves the visitor's free preview for their own chat.
 * It is the full reading, the clearest way to show what one holds.
 */
async function showSampleReading(via?: "fallback") {
  const chat = messages.value;
  const key = sampleReadingKey(question.value, me.value);
  const reading = key ? sampleReadings.value?.readings[key] : undefined;
  if (!chat || !reading) return;
  running.value = "cloud";
  progress.value = null;
  errorKey.value = null;
  errorMode.value = null;
  const from = via ?? source;
  const startedAt = performance.now();
  analyticsTools.aiStarted("sample", question.value ?? "none", from, false);
  nextTick(() =>
    document
      .querySelector(".ai-progress")
      ?.scrollIntoView({ behavior: "smooth", block: "center" }),
  );
  await new Promise((resolve) => setTimeout(resolve, SAMPLE_READING_MS));
  running.value = null;
  if (unmounted || messages.value !== chat) return;
  const { digest } = buildDigest(chat, CLOUD_TRANSCRIPT_CHARS);
  reportQuestion.value = askedQuestion.value;
  reportAsked.value = {
    preset: askedQuestion.value ? question.value : null,
    // The sample's readings that need a "me" were written to that side
    toReader: !!presets.value.find((p) => p.id === question.value)?.needsMe,
  };
  insights.value = tidyInsights(structuredClone(reading));
  coverage.value = {
    total: digest.totalMessages,
    from: digest.firstDate,
    to: digest.lastDate,
    read: countLines(digest.transcript),
    parts: 1,
  };
  ranOn.value = "cloud";
  locked.value = null;
  saveReport();
  analyticsTools.aiFinished("sample", performance.now() - startedAt, from);
  await nextTick();
  showWhereNext();
}

/** From the top of the sample's reading to the "your turn" below it. */
function tryOwnChat() {
  analyticsTools.ctaClick("ai_sample", "scroll_to_dropzone");
  document
    .getElementById("sample-yours")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

const dropzone = ref<{
  chooseFile: () => void;
  loadSample: () => Promise<void>;
} | null>(null);
/** The file picker straight away: the sample makes way for their chat. */
function chooseOwnChat() {
  analyticsTools.ctaClick("ai_sample", "hero_dropzone");
  dropzone.value?.chooseFile();
}

/** What the local card says instead of its button, if this device can't. */
const unavailableText = computed(() => {
  switch (localUnavailable.value) {
    case null:
      return "";
    case "gpu_device":
      return t("toolsAi.localUnsupportedGpu");
    case "storage":
      return t("toolsAi.localUnsupportedStorage", { gb: downloadGb.value });
    default:
      return t("toolsAi.localUnsupported");
  }
});

/** On-device failed or crashed: offer the cloud right there. */
const offerCloud = computed(
  () =>
    localCrashed.value ||
    (errorMode.value === "local" && errorKey.value !== "no_messages"),
);

/**
 * The anonymized cloud AI comes first, for everyone: subscribers get the full
 * report, everyone else the free preview. On-device only runs when picked:
 * it finished 8% of its runs, the preview 70% (GA4, November 2026).
 */
const modes = computed(() => [
  {
    id: "cloud" as Mode,
    icon: "mdi-cloud-outline",
    color: "#818cf8",
    title: t("toolsAi.cloudTitle"),
    tag: isSubscriptionValid.value
      ? t("toolsAi.cloudTag")
      : t("toolsAi.cloudTagPreview"),
    pros: [
      t("toolsAi.cloudPro1"),
      t("toolsAi.cloudPro2"),
      t("toolsAi.cloudPro3"),
      // The preview reads a quarter of what the full report does.
      isSubscriptionValid.value
        ? t("toolsAi.cloudPro4")
        : t("toolsAi.cloudPro4Preview"),
    ],
    cons: [
      ...(isSubscriptionValid.value ? [] : [t("toolsAi.cloudCon2")]),
      t("toolsAi.cloudCon1"),
    ],
    crashed: "",
    offerCloud: false,
    button: sampleReadings.value
      ? t("toolsAi.sampleButton")
      : isSubscriptionValid.value
        ? t("toolsAi.cloudButton")
        : t("toolsAi.cloudPreviewButton"),
    unavailable: "",
  },
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
    unavailable: unavailableText.value,
    crashed: localCrashed.value ? t("toolsAi.localCrashed") : "",
    offerCloud: offerCloud.value,
  },
]);

/** The cloud's "not today" answers, as the function throws them. */
const CLOUD_LIMITS = [
  "preview_used",
  "preview_cap",
  "daily_limit",
  "not_subscribed",
];

/**
 * Why the cloud won't run this one now, as a translation key: this visitor's
 * free previews used up, everyone's, today's analyses used up, or the
 * subscription not verified. Shown with the on-device AI as the way on, not
 * as a dead end.
 */
const cloudFallback = computed<string | null>(() => {
  if (
    errorMode.value === "cloud" &&
    CLOUD_LIMITS.includes(errorKey.value ?? "")
  ) {
    return `toolsAi.error_${errorKey.value}`;
  }
  if (cloudSpent.value) return "toolsAi.cloudAllowanceOut";
  return null;
});

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
// One column: the cloud card is the way, the device card the alternative.
.mode-grid {
  display: grid;
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

  &--alt {
    box-shadow: none;
    border: 1px solid rgba(29, 29, 31, 0.12);
    gap: 0.8rem;

    .mode-card__title {
      font-size: 1.1rem;
    }

    .mode-card__list li {
      font-size: 0.92rem;
    }
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

    &--secondary {
      background: #fff;
      color: #1d1d1f;
      border: 1px solid rgba(29, 29, 31, 0.25);
    }
  }

  &__link {
    align-self: center;
    font-weight: 600;
    color: $c-blue-accent-dark;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &__allowance {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4f46e5;
  }

  &__note,
  &__fineprint {
    font-size: 0.82rem;
    color: rgba(29, 29, 31, 0.6);
  }

  &__sample {
    font-size: 0.85rem;
    color: #047857;
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

.mode-card__fallback {
  display: grid;
  gap: 0.5rem;
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

    &:disabled {
      opacity: 0.5;
    }
  }

  &__fineprint {
    font-size: 0.82rem;
    color: rgba(29, 29, 31, 0.6);
  }
}

.ai-fallback {
  display: grid;
  gap: 0.6rem;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  background: #fffbeb;
  color: #1d1d1f;
  line-height: 1.45;

  &__text {
    display: flex;
    gap: 0.4rem;
    align-items: flex-start;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1.2rem;
    align-items: center;
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

  &__note {
    font-size: 0.82rem;
    color: rgba(29, 29, 31, 0.6);
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

.sample-yours {
  display: grid;
  gap: 0.8rem;
  justify-items: start;
  padding: 1.4rem 1.3rem;
  border-radius: 18px;
  background: #1d1d1f;
  color: #fff;
  line-height: 1.5;

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .mode-card__btn {
    background: #21a68d;
  }

  .mode-card__link {
    color: #9ee6d6;
  }
}

.sample-note {
  display: grid;
  gap: 0.8rem;
  justify-items: start;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  background: #ecfdf5;
  color: #1d1d1f;
  line-height: 1.5;
}
</style>
