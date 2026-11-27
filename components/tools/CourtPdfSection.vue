<template>
  <!-- Upload and download in one place: on the court and relationship pages
       the court PDF is the product, so it is not buried under the analyzer's
       charts. -->
  <LandingSection theme="white" :title="title">
    <OneTimePurchaseReturn :chat="chat" :checkout-source="checkoutSource" />
    <div id="dropzone-slot">
      <ToolDropzone
        tool-type="court"
        @analyzed="onChatAnalyzed"
        @reset="chat = null"
      />
    </div>
    <!-- #payButton: where PdfDownloadPopup scrolls a returning buyer -->
    <div v-if="chat" id="payButton" class="court-pdf">
      <p v-if="mediaNotLoaded" class="media-note">
        {{ $t("courtEvidence.mediaNotLoaded") }}
      </p>
      <!-- US courts and lawyers file on Letter; the rest of the world on A4. -->
      <div class="court-paper" role="radiogroup" aria-labelledby="court-paper">
        <span id="court-paper">{{ $t("pdfTool.paper") }}</span>
        <div class="court-paper__options">
          <label
            v-for="size in ['a4', 'letter']"
            :key="size"
            :class="{ 'is-selected': paper === size }"
          >
            <input
              v-model="paper"
              type="radio"
              name="court-paper"
              :value="size"
              class="visually-hidden"
            />
            {{ $t(`pdfTool.paperSize.${size}`) }}
          </label>
        </div>
      </div>
      <PdfDownloadPopup
        :chat="chat"
        :attachments="attachments"
        :ego="ego"
        :source="source"
        :is-valid-subscription="isSubscriptionValid"
        :court-paper="paper"
        court
      />
    </div>
  </LandingSection>
</template>

<script setup>
import {
  computed,
  markRaw,
  nextTick,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { defaultPaper } from "~/utils/pdf/paperDefault";
import { storeToRefs } from "pinia";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import PdfDownloadPopup from "~/components/ChatVisualization/PdfDownloadPopup.vue";
import OneTimePurchaseReturn from "~/components/ChatVisualization/OneTimePurchaseReturn.vue";
import { Chat } from "~/utils/transformChatData";
import { useSubscriptionStore } from "~/stores/subscription";
import { scrollToSettled } from "~/utils/scroll";

defineProps({
  title: { type: String, required: true },
  // analytics label for a one-time purchase made here
  checkoutSource: { type: String, required: true },
});

// kept out of Vue's deep reactivity: Chat caches its lazy getters on itself,
// and proxying a whole chat is slow
const chat = shallowRef(null);
const attachments = shallowRef([]);
const source = shallowRef(null);
const ego = computed(() => chat.value?.messagesPerPerson[0]?.name || "");
const { isSubscriptionValid } = storeToRefs(useSubscriptionStore());
// A chat restored from the browser session (a reload, the way back from
// Stripe) keeps its attachments' names but not the files, so the exhibit
// index cannot hash them until the export is dropped again.
const mediaNotLoaded = computed(
  () =>
    attachments.value.length > 0 &&
    attachments.value.every((file) => !file.zipEntry && !file.decompressedData),
);

// Remembered on this device, so a buyer back from checkout gets the paper
// they chose; otherwise the one their region prints on.
const PAPER_KEY = "wa-court-paper";
const paper = ref("a4");
function storedPaper() {
  try {
    return localStorage.getItem(PAPER_KEY);
  } catch {
    return null;
  }
}
onMounted(() => {
  const stored = storedPaper();
  paper.value =
    stored === "a4" || stored === "letter" ? stored : defaultPaper();
});
watch(paper, (value) => {
  try {
    localStorage.setItem(PAPER_KEY, value);
  } catch {
    // the choice lasts for this page only
  }
});

function onChatAnalyzed(payload) {
  chat.value = markRaw(new Chat(payload.messages));
  attachments.value = payload.attachments || [];
  source.value = payload.source || null;
  nextTick(() => scrollToSettled("#payButton", { offset: 80 }));
}
</script>

<style lang="scss" scoped>
#dropzone-slot {
  margin-top: 2.5rem;
  scroll-margin-top: 6rem;
}

.media-note {
  margin: 0 0 1rem;
  padding: 0.9rem 1.1rem;
  border-radius: $wa-radius-md;
  background: rgba(33, 166, 141, 0.08);
  color: $wa-ink-muted;
  font-size: 0.875rem;
  line-height: 1.5;
}

.court-paper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: $wa-ink-muted;
}

.court-paper__options {
  display: inline-flex;
  border: 1px solid $wa-border;
  border-radius: $wa-radius-md;
  overflow: hidden;

  label {
    position: relative;
    padding: 0.35rem 0.9rem;
    color: $wa-ink;
    cursor: pointer;

    &.is-selected {
      background: $wa-accent;
      color: #ffffff;
    }

    &:focus-within {
      outline: 2px solid $wa-accent;
      outline-offset: -2px;
    }
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.court-pdf {
  max-width: 960px;
  margin: 3rem auto 0;
  scroll-margin-top: 6rem;
}
</style>
