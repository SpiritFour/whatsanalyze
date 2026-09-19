<template>
  <div
    class="wrapped-scope bg-surface-dark w-full h-full min-h-screen text-gray-300"
  >
    <SiteHeader />

    <main class="text-white font-sans px-4 md:px-0 pt-8 md:pt-12">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>

<script lang="ts" setup>
import { useLocaleHead } from "#i18n";

// Same reason as layouts/default.vue: the lang attribute, hreflang alternates
// and canonical have to follow the route's locale, not nuxt.config's "en".
const localeHead = useLocaleHead();

useHead(() => ({
  meta: [
    {
      name: "viewport",
      content:
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
    },
    { name: "color-scheme", content: "dark" },
    { name: "theme-color", content: "#0d1418" },
    ...(localeHead.value.meta || []),
  ],
  link: localeHead.value.link,
  htmlAttrs: {
    ...localeHead.value.htmlAttrs,
    style: "background-color: #0d1418;",
  },
  bodyAttrs: {
    style: "background-color: #0d1418;",
  },
}));
</script>
