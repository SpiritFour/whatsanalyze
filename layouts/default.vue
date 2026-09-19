<template>
  <v-app>
    <SiteHeader />

    <v-main style="overflow-x: hidden">
      <FeedbackBtn />
      <slot />
    </v-main>

    <SiteFooter />
  </v-app>
</template>

<script setup>
import { useLocaleHead } from "#i18n";

// nuxt.config hardcodes lang="en", so /de/ and /fr/ told every crawler they
// were English pages, and no route ever pointed at its translations. This is
// where the lang attribute, the hreflang alternates and the canonical come
// from instead.
const localeHead = useLocaleHead();
useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: localeHead.value.link,
  meta: localeHead.value.meta,
}));
</script>
