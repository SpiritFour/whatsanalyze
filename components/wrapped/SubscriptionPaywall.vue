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

      <p
        class="text-xs uppercase tracking-[0.3em] text-green-400 font-semibold mb-3"
      >
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
          {{
            isStarting
              ? t("home.subscriptionAd.pro.loading")
              : t("chooseSubscription")
          }}
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

      <div class="mt-6 border-t border-gray-700/60 pt-6">
        <p class="text-sm font-semibold text-white">
          {{ t("upload.paywall.reminder.title") }}
        </p>
        <p
          v-if="reminderSent"
          class="mt-3 text-sm text-green-300"
          data-testid="reminder-confirmation"
        >
          {{ t("upload.paywall.reminder.success") }}
        </p>
        <form
          v-else
          class="mt-3 flex flex-col gap-2 sm:flex-row"
          @submit.prevent="requestReminder"
        >
          <input
            v-model="reminderEmail"
            type="email"
            required
            autocomplete="email"
            :placeholder="t('upload.paywall.reminder.placeholder')"
            class="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
          />
          <button
            type="submit"
            :disabled="isSavingReminder"
            class="rounded-xl border border-green-600 px-4 py-3 text-sm font-semibold text-green-300 hover:bg-green-600/20 transition disabled:opacity-60 disabled:cursor-wait"
          >
            {{ t("upload.paywall.reminder.cta") }}
          </button>
        </form>
        <p v-if="!reminderSent" class="mt-2 text-xs text-gray-500">
          {{ t("upload.paywall.reminder.note") }}
        </p>
        <p v-if="reminderError" class="mt-2 text-xs text-red-200">
          {{ t("upload.paywall.reminder.error") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { fetchWrappedCheckoutUrl } from "~/utils/subscription";
import { requestFreeUploadReminder } from "~/utils/wrapped/reminder";
import {
  analyticsEcommerce,
  analyticsWrapped,
  ITEM_PRO_SUBSCRIPTION,
} from "~/composables/useAnalytics";

const props = defineProps<{
  open: boolean;
}>();

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      analyticsEcommerce.viewItem("wrapped_paywall", ITEM_PRO_SUBSCRIPTION);
    }
  },
  { immediate: true },
);
const emit = defineEmits<{
  close: [];
}>();

const isStarting = ref(false);
const checkoutError = ref("");
const { t, locale } = useI18n();

const reminderEmail = ref("");
const isSavingReminder = ref(false);
const reminderSent = ref(false);
const reminderError = ref(false);

const requestReminder = async () => {
  if (isSavingReminder.value) return;
  reminderError.value = false;
  try {
    isSavingReminder.value = true;
    await requestFreeUploadReminder(reminderEmail.value.trim(), locale.value);
    reminderSent.value = true;
    analyticsWrapped.reminderRequested();
  } catch (err) {
    reminderError.value = true;
    console.error("Reminder signup failed:", err);
  } finally {
    isSavingReminder.value = false;
  }
};

const handleClose = () => {
  if (isStarting.value) return;
  emit("close");
};

const startSubscription = async () => {
  if (isStarting.value) return;
  checkoutError.value = "";

  analyticsEcommerce.beginCheckout({
    checkoutType: "subscription",
    source: "wrapped_paywall",
  });

  try {
    isStarting.value = true;
    const url = await fetchWrappedCheckoutUrl();

    if (!url) {
      throw new Error(t("home.subscriptionAd.errors.checkoutLinkMissing"));
    }

    window.location.assign(url);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : t("home.subscriptionAd.errors.general");
    checkoutError.value = message;
    console.error("Paywall checkout error:", err);
  } finally {
    isStarting.value = false;
  }
};
</script>
