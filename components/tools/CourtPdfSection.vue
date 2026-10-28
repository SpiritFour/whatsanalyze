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
      <PdfDownloadPopup
        :chat="chat"
        :attachments="attachments"
        :ego="ego"
        :source="source"
        :is-valid-subscription="isSubscriptionValid"
        court
      />
    </div>
  </LandingSection>
</template>

<script setup>
import { computed, markRaw, nextTick, shallowRef } from "vue";
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

.court-pdf {
  max-width: 960px;
  margin: 3rem auto 0;
  scroll-margin-top: 6rem;
}
</style>
