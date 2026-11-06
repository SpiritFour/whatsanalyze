<template>
  <div class="flex items-center justify-center w-full relative">
    <label
      class="bg-whatsapp flex flex-col items-center justify-center w-full h-64 rounded-lg cursor-pointer hover:bg-gray-900 bg-gray-950 border-2 border-dashed hover:border-solid border-white hover:border-green-500 hover:text-green-600 p-2 text-center"
      for="dropzone-file"
    >
      <div class="flex flex-col items-center justify-center pt-5 pb-6">
        <svg
          aria-hidden="true"
          class="w-8 h-8 mb-4"
          fill="none"
          viewBox="0 0 20 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          />
        </svg>

        <p class="text-gray-100">
          {{ $t("upload.dragDrop") }}
        </p>
        <p class="text-xs text-gray-400 my-2">
          {{ $t("upload.noServerUpload") }}
        </p>
        <p class="text-xs text-gray-400">{{ $t("upload.fileFormats") }}</p>
      </div>
      <input
        id="dropzone-file"
        accept=".txt,.zip"
        class="hidden"
        type="file"
        @change="handleFile"
      />
    </label>
  </div>

  <!-- A chat saved on this device: its Wrapped without a new upload -->
  <ClientOnly>
    <LibraryPicker :busy="isLoading" @open="openSaved" />
  </ClientOnly>

  <div v-if="isLoading" class="bg-blue-500">
    <pre>{{ $t("upload.loading") }}</pre>
  </div>

  <WrappedSubscriptionPaywall
    :open="showPaywall"
    @close="showPaywall = false"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { sendFile, sendMessages } from "~/assets/workers";
import { useStatsStore } from "~/stores/wrapped/stats";
import { useSubscriptionStore } from "~/stores/subscription";
import { useUploadAccessStore } from "~/stores/wrapped/uploadAccessStore";
import { analyticsChat, analyticsWrapped } from "~/composables/useAnalytics";
import { parseChatFile } from "~/composables/useChatTool";
import { useLibrary, type SavedChat } from "~/composables/useLibrary";
import { getTargetYear } from "~/utils/wrapped/dateUtils";
import { WRAPPED_PAYWALL_ENABLED } from "~/config/wrapped";
const localePath = useLocalePath();
const library = useLibrary();

const statsStore = useStatsStore();
const subscriptionStore = useSubscriptionStore();
const uploadAccessStore = useUploadAccessStore();

const { result, isLoading } = storeToRefs(statsStore);
const { isSubscriptionValid } = storeToRefs(subscriptionStore);
const showPaywall = ref(false);

watch(isSubscriptionValid, (isValid) => {
  if (isValid) {
    showPaywall.value = false;
  }
});

const handleFile = async (e: Event): Promise<void> => {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files.length) return;
  const file = input.files[0];

  const isFreeUpload = !isSubscriptionValid.value;
  if (
    WRAPPED_PAYWALL_ENABLED &&
    isFreeUpload &&
    !uploadAccessStore.hasFreeUploadToday()
  ) {
    showPaywall.value = true;
    analyticsWrapped.paywallViewed("upload_gate");
    input.value = "";
    return;
  }

  const fileType = file.name.endsWith(".zip") ? "zip" : "txt";
  analyticsChat.uploadStarted(fileType, "picker");

  statsStore.$reset();
  isLoading.value = true;

  try {
    result.value = (await sendFile(file)) ?? undefined;

    if (result.value) {
      const count = result.value.getWordUsage.totalMessagesCount ?? 0;
      analyticsChat.parsedSuccess(count);
    }

    // Recorded with the gate off too, so switching it back on counts today.
    if (isFreeUpload) {
      uploadAccessStore.markFreeUploadUsed();
    }

    navigateTo({
      path: localePath("/wrapped/results"),
    });
    if (result.value) void keepUpload(file);
  } catch (err) {
    console.error("Failed to process chat upload:", err);
  } finally {
    isLoading.value = false;
    input.value = "";
  }
};

/**
 * Saved on this device by default, like every upload. The story above came
 * from Wrapped's own parser; what is saved is the chat as every other page
 * reads it, so it opens in all of them.
 */
async function keepUpload(file: File) {
  try {
    const parsed = await parseChatFile(file);
    const id = await library.keep(parsed, { source: "wrapped" });
    // Unwrapped for this year: opening it again is no new free analysis.
    if (id) await library.markWrapped(id, getTargetYear());
    if (id) await library.setLastTool(id, "/wrapped/");
  } catch (err) {
    console.warn("Could not keep the Wrapped upload:", err);
  }
}

/**
 * A saved chat's Wrapped. One that was unwrapped for this year already
 * opens without spending the day's free analysis, which counts new chats.
 */
async function openSaved(id: string) {
  const chat: SavedChat | null = library.chatById(id);
  const year = getTargetYear();
  const unwrapped = !!chat?.wrappedYears?.includes(year);
  const isFreeUpload = !isSubscriptionValid.value && !unwrapped;
  if (
    WRAPPED_PAYWALL_ENABLED &&
    isFreeUpload &&
    !uploadAccessStore.hasFreeUploadToday()
  ) {
    showPaywall.value = true;
    analyticsWrapped.paywallViewed("upload_gate");
    return;
  }

  statsStore.$reset();
  isLoading.value = true;
  try {
    const opened = await library.open(id, { source: "wrapped" });
    if (!opened) return;
    result.value = (await sendMessages(opened.messages)) ?? undefined;
    if (!result.value) return;
    if (isFreeUpload) uploadAccessStore.markFreeUploadUsed();
    await library.markWrapped(id, year);
    void library.setLastTool(id, "/wrapped/");
    navigateTo({ path: localePath("/wrapped/results") });
  } catch (err) {
    console.error("Failed to open the saved chat:", err);
  } finally {
    isLoading.value = false;
  }
}
</script>
