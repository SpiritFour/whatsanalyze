<script lang="ts" setup>
const localePath = useLocalePath();

defineProps({
  logoOnly: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <NuxtLink
    class="flex items-center align-middle gap-6 cursor-pointer"
    :to="localePath('/wrapped')"
  >
    <div
      class="rounded-full flex items-center justify-center bg-gradient p-1"
      style="width: 38px; height: 38px"
    >
      <img alt="logo" class="text-clip" src="/img/logo-inverse.png" width="38px" />
    </div>

    <div v-if="!logoOnly" class="relative flex">
      <strong class="mr-2 text-xl md:text-3xl">WhatsAnalyze</strong>
      <slot />
    </div>
  </NuxtLink>
</template>
