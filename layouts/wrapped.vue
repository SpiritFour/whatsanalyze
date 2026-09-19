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
