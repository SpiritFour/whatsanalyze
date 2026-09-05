<template>
  <div
    v-if="shareErrorMessage"
    class="mx-auto mt-6 max-w-lg rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100"
  >
    {{ shareErrorMessage }}
  </div>
  <div
    v-else-if="shareLoading"
    class="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center text-sm text-emerald-100"
  >
    {{ t("results.status.loadingSharedStory") }}
  </div>

  <WrappedStoryCarousel :duration="6000">
    <WrappedStoriesIntro1 />
    <WrappedStoriesIntro2 />

    <WrappedStoriesEmoji1 />
    <WrappedStoriesEmoji2 />
    <WrappedStoriesEmoji3 />

    <WrappedStoriesWords1 />
    <WrappedStoriesWords2 />
    <WrappedStoriesWords3 />

    <WrappedStoriesConversation1 />
    <WrappedStoriesConversation2 />
    <WrappedStoriesShareInvite />
  </WrappedStoryCarousel>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useStatsStore } from "~/stores/wrapped/stats";
import { useUserDataStore } from "~/stores/wrapped/userDataStore";
import { parseShareInfo } from "~/utils/wrapped/sharing/param";
import { useI18n } from "vue-i18n";

definePageMeta({
  layout: "wrapped",
});

const route = useRoute();
const { trackResultsViewed } = useAnalytics();

const statsStore = useStatsStore();
const { result } = storeToRefs(statsStore);
const userDataStore = useUserDataStore();

const { t } = useI18n();

useSeoMeta({
  title: "Your WhatsApp Wrapped Story",
  description: "View your personalized WhatsApp Wrapped year in review story.",
});

const shareLoading = ref(false);
const shareErrorKey = ref<string | null>(null);
const shareErrorMessage = computed(() =>
  shareErrorKey.value ? t(shareErrorKey.value) : "",
);

const buildSearchFromQuery = () => {
  const params = new URLSearchParams();
  const uuidParam = route.query.uuid;
  const ivParam = route.query.iv;
  const keyParam = route.query.key;

  if (
    typeof uuidParam !== "string" ||
    typeof ivParam !== "string" ||
    typeof keyParam !== "string"
  ) {
    return null;
  }

  params.set("uuid", uuidParam);
  params.set("iv", ivParam);
  params.set("key", keyParam);
  return params.toString();
};

const loadSharedStory = async () => {
  const queryString = buildSearchFromQuery();
  if (!queryString) {
    shareErrorKey.value = null;
    shareLoading.value = false;
    return;
  }

  shareLoading.value = true;
  shareErrorKey.value = null;

  try {
    const shareInfo = parseShareInfo(queryString);
    const loadedData = await userDataStore.loadData(shareInfo);
    result.value = loadedData;
  } catch (error) {
    console.error("Failed to load shared story", error);
    shareErrorKey.value = "results.status.decryptError";
  } finally {
    shareLoading.value = false;
  }
};

watch(
  () => ({ ...route.query }),
  () => {
    loadSharedStory();
  },
  { immediate: true },
);

onMounted(() => {
  const isShared = !!buildSearchFromQuery();
  trackResultsViewed(isShared);
});
</script>

<style scoped>
.chat-bubble {
  @apply max-w-md w-fit bg-green-700 bg-opacity-70 p-3 rounded-lg shadow-md flex flex-col;
}

.chat-bubble .author {
  @apply text-sm font-semibold text-gray-800 mb-1;
}

.chat-bubble .time {
  @apply text-xs text-gray-800;
}

.chat-bubble .message {
  @apply text-sm text-gray-900;
}

h2 {
  @apply text-8xl;
}

strong {
  @apply text-orange-500 italic;
}

h3 {
  @apply text-[200px];
}
</style>
