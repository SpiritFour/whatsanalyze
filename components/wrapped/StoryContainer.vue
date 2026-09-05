<template>
  <div
    class="w-full h-full flex items-center justify-center text-center relative flex-col gap-2"
  >
    <h2
      v-if="title"
      class="font-extrabold break-words w-3/4 text-shadow-lg text-shadow-white z-50"
      style="text-shadow: 0 0 3px black"
    >
      {{ title }}
    </h2>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ title?: string }>();
</script>
