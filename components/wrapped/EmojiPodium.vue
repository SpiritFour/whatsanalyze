<!-- components/EmojiPodium.vue -->
<template>
  <div class="relative h-40 mt-40">
    <!-- 1st place -->
    <div
      v-if="topThreeEmojies?.[0]"
      ref="first"
      class="absolute text-8xl -translate-x-1/2 -translate-y-1/2 left-14 -top-24"
    >
      {{ topThreeEmojies[0]?.emoji }}
    </div>

    <!-- 2nd place -->
    <div
      v-if="topThreeEmojies?.[1]"
      ref="second"
      class="absolute text-6xl -translate-x-1/2 -translate-y-1/2 left-0 -top-2"
    >
      {{ topThreeEmojies[1]?.emoji }}
    </div>

    <!-- 3rd place -->
    <div
      v-if="topThreeEmojies?.[2]"
      ref="third"
      class="absolute text-6xl -translate-x-1/2 -translate-y-1/2 -right-0 -top-2"
    >
      {{ topThreeEmojies[2]?.emoji }}
    </div>

    <img alt="Podium" class="h-32" src="/podest.png" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { animate } from "motion";
import type { EmojiStats } from "~/utils/wrapped/parsing/types";

const props = defineProps<{
  topThreeEmojies: EmojiStats[];
}>();

const first = ref<HTMLElement | null>(null);
const second = ref<HTMLElement | null>(null);
const third = ref<HTMLElement | null>(null);

onMounted(() => {
  // 🥇 First (center) walks in from left with a tiny hop
  if (first.value) {
    first.value.style.opacity = "0";
    animate(
      first.value,
      {
        // @ts-ignore
        x: [-260, -120, -60, -20, 0],
        opacity: [0, 1, 1, 1, 1],
      },
      {
        duration: 0.9,
        easing: "ease-out",
      },
    ).finished.then(() => {
      if (first.value) {
        animate(
          // @ts-ignore
          first.value,
          { y: [0, -8, 0] },
          { duration: 0.5, easing: "ease-in-out", repeat: Infinity },
        );
      }
    });
  }

  // 🥈 Second (left) walks in from further left
  if (second.value) {
    second.value.style.opacity = "0";
    animate(
      second.value,
      {
        // @ts-ignore
        x: [-200, -120, -60, 0],
        opacity: [0, 0.6, 1, 1],
      },
      {
        duration: 0.9,
        delay: 0.15,
        easing: "ease-out",
      },
    ).finished.then(() => {
      if (second.value) {
        animate(
          // @ts-ignore
          second.value,
          { y: [0, -5, 0] },
          { duration: 0.6, easing: "ease-in-out", repeat: Infinity },
        );
      }
    });
  }

  // 🥉 Third (right) walks in from right
  if (third.value) {
    third.value.style.opacity = "0";
    animate(
      third.value,
      {
        // @ts-ignore
        x: [200, 120, 60, 0],
        opacity: [0, 0.6, 1, 1],
      },
      {
        duration: 0.9,
        delay: 0.3,
        easing: "ease-out",
      },
    ).finished.then(() => {
      if (third.value) {
        animate(
          // @ts-ignore
          third.value,
          { y: [0, -5, 0] },
          { duration: 0.6, easing: "ease-in-out", repeat: Infinity },
        );
      }
    });
  }
});
</script>
