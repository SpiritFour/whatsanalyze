<template>
  <div class="w-full mb-12">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-12">
        <p
          class="text-xs uppercase tracking-[0.3em] text-green-400 font-semibold mb-3"
        >
          {{ t("home.subscriptionAd.eyebrow") }}
        </p>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {{ t("home.subscriptionAd.headline") }}
        </h1>
        <p class="text-gray-400">
          {{ t("home.subscriptionAd.description") }}
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Free Plan -->
        <div
          class="flex flex-col h-full rounded-2xl border border-gray-700/60 bg-gray-900/30 shadow-sm p-6 md:p-7"
        >
          <div class="mb-4">
            <span
              class="inline-flex items-center rounded-full border border-gray-700 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-200"
            >
              {{ t("home.subscriptionAd.free.badge") }}
            </span>
          </div>

          <h2 class="text-xl font-semibold mb-1">
            {{ t("home.subscriptionAd.free.headline") }}
          </h2>
          <p class="text-gray-400 text-sm mb-5">
            {{ t("home.subscriptionAd.free.description") }}
          </p>

          <div class="mb-6">
            <span class="text-3xl font-bold">€0</span>
            <span class="text-gray-500 text-sm ml-1">
              {{ t("home.subscriptionAd.free.priceSuffix") }}
            </span>
          </div>

          <ul class="space-y-2 text-sm text-gray-300 mb-6 flex-1">
            <li v-for="feature in freeFeatures" :key="feature" class="flex gap-2">
              <span class="mt-[6px] h-1.5 w-1.5 rounded-full bg-gray-500"></span>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <a
            class="w-full inline-flex items-center justify-center rounded-xl border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-800 transition"
            href="#top"
            type="button"
          >
            {{ t("home.subscriptionAd.free.cta") }}
          </a>
        </div>

        <!-- Pro Plan -->
        <div
          class="relative flex flex-col h-full rounded-2xl border border-green-500 bg-gradient-to-b from-green-500 via-black to-black shadow-lg p-6 md:p-7"
        >
          <div class="absolute -top-3 right-4">
            <span
              class="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow"
            >
              {{ t("home.subscriptionAd.pro.badge") }}
            </span>
          </div>

          <div class="mb-4">
            <span
              class="inline-flex items-center rounded-full border border-green-100/80 bg-green-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-green-700"
            >
              {{ t("home.subscriptionAd.pro.label") }}
            </span>
          </div>

          <h2 class="text-xl font-semibold mb-1">
            {{ t("home.subscriptionAd.pro.headline") }}
          </h2>
          <p class="text-white text-sm mb-5">
            {{ t("home.subscriptionAd.pro.description") }}
          </p>

          <div class="mb-2">
            <span class="text-3xl font-bold">€10</span>
            <span class="text-gray-300 text-sm ml-1">
              {{ t("home.subscriptionAd.pro.priceSuffix") }}
            </span>
          </div>
          <p class="text-xs text-gray-300 mb-6">
            {{ t("home.subscriptionAd.pro.note") }}
          </p>

          <ul class="space-y-2 text-sm text-gray-100 mb-6 flex-1">
            <li v-for="feature in proFeatures" :key="feature" class="flex gap-2">
              <span class="mt-[6px] h-1.5 w-1.5 rounded-full bg-green-500"></span>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <button
            class="w-full inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-wait"
            type="button"
            :disabled="isStarting"
            @click="startSubscription"
          >
            {{
              isStarting
                ? t("home.subscriptionAd.pro.loading")
                : t("home.subscriptionAd.pro.cta")
            }}
          </button>
          <p class="text-xs text-gray-300 text-center mt-3">
            {{ t("home.subscriptionAd.footnote") }}
          </p>
          <p v-if="checkoutError" class="text-xs text-red-200 text-center mt-2">
            {{ checkoutError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { fetchSubscriptionCheckoutUrl } from "~/utils/wrapped/subscription";

const isStarting = ref(false);
const checkoutError = ref("");
const { t, tm } = useI18n();

const freeFeatures = computed(
  () => tm("home.subscriptionAd.free.features") as string[]
);
const proFeatures = computed(
  () => tm("home.subscriptionAd.pro.features") as string[]
);

const startSubscription = async () => {
  if (isStarting.value) return;
  checkoutError.value = "";

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
    console.error("Stripe checkout error:", err);
  } finally {
    isStarting.value = false;
  }
};
</script>
