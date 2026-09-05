<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="relative max-w-lg w-full rounded-2xl border border-gray-700/60 bg-gray-900/95 p-8 shadow-2xl"
    >
      <button
        class="absolute right-4 top-4 text-gray-400 hover:text-white transition"
        type="button"
        @click="handleClose"
      >
        <span class="sr-only">Close</span>
        &times;
      </button>

      <p class="text-xs uppercase tracking-[0.3em] text-green-400 font-semibold mb-3">
        {{ t("nav.subscription") }}
      </p>
      <h3 class="text-2xl font-bold text-white mb-3">
        {{ t("upload.paywall.title") }}
      </h3>
      <p class="text-gray-300 mb-6">
        {{ t("upload.paywall.description") }}
      </p>

      <div class="space-y-3">
        <button
          class="w-full inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-wait"
          type="button"
          :disabled="isStarting"
          @click="startSubscription"
        >
          {{ isStarting ? t("home.subscriptionAd.pro.loading") : t("upload.paywall.cta") }}
        </button>
        <button
          class="w-full inline-flex items-center justify-center rounded-xl border border-gray-700 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 transition"
          type="button"
          @click="handleClose"
        >
          {{ t("upload.paywall.secondary") }}
        </button>
      </div>

      <p v-if="checkoutError" class="text-xs text-red-200 text-center mt-4">
        {{ checkoutError }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { fetchSubscriptionCheckoutUrl } from "~/utils/wrapped/subscription";

const { trackSubscriptionStarted } = useAnalytics();

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const isStarting = ref(false);
const checkoutError = ref("");
const { t } = useI18n();

const handleClose = () => {
  if (isStarting.value) return;
  emit("close");
};

const startSubscription = async () => {
  if (isStarting.value) return;
  checkoutError.value = "";

  trackSubscriptionStarted("paywall");

  try {
    isStarting.value = true;
    const url = await fetchSubscriptionCheckoutUrl();

    if (!url) {
      throw new Error(t("home.subscriptionAd.errors.checkoutLinkMissing"));
    }

    window.location.assign(url);
  } catch (err: any) {
    checkoutError.value =
      err?.message || t("home.subscriptionAd.errors.general");
    console.error("Paywall checkout error:", err);
  } finally {
    isStarting.value = false;
  }
};
</script>
