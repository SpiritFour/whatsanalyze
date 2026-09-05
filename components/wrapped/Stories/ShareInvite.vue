<template>
  <WrappedStoryContainer
    class="bg-gradient-to-b from-slate-900 via-emerald-900/40 to-black text-center px-8 py-12"
    :title="t('results.share.title')"
  >
    <WrappedStyleSoftOrbs class="opacity-60" />
    <p class="text-base text-slate-100/80 tracking-wide leading-relaxed">
      {{ t("results.share.description") }}
    </p>

    <div class="flex flex-col gap-3 w-full mt-10">
      <button
        class="rounded-full bg-emerald-400 text-black font-semibold py-3 px-6 shadow-lg shadow-emerald-500/40 hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        :disabled="isPreparing || !hasResult"
        @click="handleShare"
      >
        <span v-if="isPreparing">{{ t("results.share.preparing") }}</span>
        <span v-else>{{ shareButtonLabel }}</span>
      </button>

      <button
        class="rounded-full border border-white/30 py-3 px-6 font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="isPreparing"
        @click="handleAnalyzeAnother"
      >
        {{ t("results.share.buttons.analyzeAnother") }}
      </button>
    </div>

    <p v-if="shareMessageText" class="mt-4 text-sm text-emerald-200">
      {{ shareMessageText }}
    </p>
    <p v-if="shareErrorText" class="mt-4 text-sm text-rose-200">
      {{ shareErrorText }}
    </p>

    <div
      v-if="shareUrl && !canNativeShare"
      class="mt-4 text-xs text-slate-200/80 break-words"
    >
      {{ shareUrl }}
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import SoftOrbs from "~/components/wrapped/Style/SoftOrbs.vue";
import { useStatsStore } from "~/stores/wrapped/stats";
import { useUserDataStore } from "~/stores/wrapped/userDataStore";
import { serializeShareInfo } from "~/utils/wrapped/sharing/param";

const statsStore = useStatsStore();
const userDataStore = useUserDataStore();
const { result } = storeToRefs(statsStore);
const { t } = useI18n();
const { trackShareCreated } = useAnalytics();

const runtimeConfig = useRuntimeConfig();

const isPreparing = ref(false);
const shareUrl = ref("");
const shareMessageKey = ref<string | null>(null);
const shareErrorKey = ref<string | null>(null);

const hasResult = computed(() => Boolean(result.value));

const canNativeShare = computed(
  () => process.client && typeof navigator !== "undefined" && !!navigator.share,
);

const shareButtonLabel = computed(() =>
  canNativeShare.value
    ? t("results.share.buttons.shareNative")
    : t("results.share.buttons.shareCopy"),
);

const shareMessageText = computed(() =>
  shareMessageKey.value ? t(shareMessageKey.value) : "",
);
const shareErrorText = computed(() =>
  shareErrorKey.value ? t(shareErrorKey.value) : "",
);

const resolveBaseUrl = () => {
  if (process.client && typeof window !== "undefined") {
    return window.location.origin;
  }
  const configured = runtimeConfig.public.baseUrl ?? "";
  return configured.replace(/\/$/, "");
};

const buildShareUrl = (queryString: string) => {
  const base = resolveBaseUrl();
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}/results?${queryString}`;
};

const copyToClipboard = async (text: string) => {
  if (!process.client) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const prepareShareLink = async (): Promise<string> => {
  if (!result.value) {
    throw new Error("No analysis result found.");
  }
  if (shareUrl.value) {
    return shareUrl.value;
  }

  isPreparing.value = true;
  shareErrorKey.value = null;
  shareMessageKey.value = null;

  try {
    const shareInfo = await userDataStore.saveData(result.value);
    const queryString = serializeShareInfo(shareInfo);
    const url = buildShareUrl(queryString);
    shareUrl.value = url;
    return url;
  } finally {
    isPreparing.value = false;
  }
};

const handleShare = async () => {
  shareErrorKey.value = null;
  shareMessageKey.value = null;

  try {
    const url = await prepareShareLink();

    if (canNativeShare.value && navigator.share) {
      await navigator.share({
        title: t("results.share.nativeShareTitle"),
        text: t("results.share.nativeShareText"),
        url,
      });
      shareMessageKey.value = "results.share.messages.nativeShare";
      trackShareCreated("native");
    } else {
      await copyToClipboard(url);
      shareMessageKey.value = "results.share.messages.linkCopied";
      trackShareCreated("copy");
    }
  } catch (error) {
    console.error("Failed to share story", error);
    shareErrorKey.value = "results.share.messages.unableToPrepare";
  }
};

const handleAnalyzeAnother = async () => {
  statsStore.$reset();
  await navigateTo("/");
};
</script>
