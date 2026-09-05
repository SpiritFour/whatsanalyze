<template>
  <WrappedStoryContainer v-if="result">
    <WrappedStyleGlow />

    <WrappedStylePolygon />

    <div
      class="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center"
    >
      <div
        class="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl mb-2"
      >
        <span
          class="bg-gradient-to-r from-emerald-300 via-emerald-400 to-lime-300 bg-clip-text text-transparent"
        >
          {{ data.winner }}
        </span>
      </div>

      <div class="text-xl text-slate-200">
        {{ t('results.words.duel.messagedLabel') }}
      </div>

      <div
        class="py-6 text-[5rem] font-extrabold leading-none tracking-tight md:text-[6rem] lg:text-[7rem]"
      >
        {{ data.difference }}
      </div>

      <div class="text-xl font-medium text-slate-200 mb-2">
        {{ t('results.words.duel.moreWordsThan') }}
      </div>

      <div
        class="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl"
      >
        <span
          class="bg-gradient-to-r from-rose-400 via-red-500 to-orange-400 bg-clip-text text-transparent"
        >
          {{ data.looser }}
        </span>
      </div>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";
import Glow from "~/components/wrapped/Style/Glow.vue";

const statsStore = useStatsStore();

const { result } = storeToRefs(statsStore);
const { t } = useI18n();

const data = computed(() => {
  const wordUsage = result.value?.getWordUsage;

  if (!wordUsage) return { looser: "", winner: "", difference: 0 };

  let min = 1;
  let max = 0;
  let currentWinner = "";
  let currentLooser = "";
  for (const [author, data] of Object.entries(wordUsage.authors)) {
    if (data.relativeWords > max) {
      max = data.relativeWords;
      currentWinner = author;
    }

    if (data.relativeWords < min) {
      min = data.relativeWords;
      currentLooser = author;
    }
  }
  console.log(min, max, currentLooser, currentWinner);
  const difference = Math.floor((max - min) * wordUsage.totalWordCount);
  return { looser: currentLooser, winner: currentWinner, difference };
});
const word_count = computed(() => {
  if (!result.value) return [];
});
</script>
