<template>
  <div
    class="w-full h-full flex items-center justify-center text-center relative flex-col gap-2 isolate pt-8 pb-4 px-4"
  >
    <h2
      v-if="title"
      class="font-extrabold break-words w-full max-w-xs sm:max-w-sm text-2xl sm:text-3xl text-shadow-lg text-shadow-white z-50 shrink-0 mb-2 leading-tight"
      style="text-shadow: 0 0 3px black"
    >
      {{ title }}
    </h2>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
});
</script>
