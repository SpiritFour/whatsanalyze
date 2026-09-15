<template>
  <div
    class="wrapped-scope bg-surface-dark w-full h-full min-h-screen text-gray-300"
  >
    <SiteHeader :links="wrappedLinks" />

    <main class="text-white font-sans px-4 md:px-0 pt-8 md:pt-12">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSubscriptionStore } from "~/stores/subscription";

const { t } = useI18n();
const localePath = useLocalePath();
const subscriptionStore = useSubscriptionStore();
const { isVerified } = storeToRefs(subscriptionStore);

// Wrapped's own destinations, hung off the shared header so /wrapped keeps the
// same bar, brand and language picker as the rest of the site.
const wrappedLinks = computed(() => [
  {
    to: localePath("/wrapped/subscription/verify"),
    label: t("nav.subscription"),
    icon: isVerified.value
      ? "mdi-check-circle-outline"
      : "mdi-information-outline",
  },
  {
    to: localePath("/wrapped") + "#privacy",
    label: t("nav.privacy"),
  },
  {
    to: localePath("/wrapped") + "#guide",
    label: t("nav.exportGuide"),
  },
]);

useHead({
  meta: [
    {
      name: "viewport",
      content:
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
    },
    { name: "color-scheme", content: "dark" },
    { name: "theme-color", content: "#0d1418" },
  ],
  htmlAttrs: {
    style: "background-color: #0d1418;",
  },
  bodyAttrs: {
    style: "background-color: #0d1418;",
  },
});
</script>
