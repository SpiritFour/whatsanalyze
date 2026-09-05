<template>
  <WrappedStoryContainer
    v-if="result"
    class="text-5xl"
    :title="t('results.words.breakdown.title')"
  >
    <WrappedStylePolygon />

    <div
      v-for="(data, author) in result.getWordUsage.authors"
      :key="author"
      class="w-full mt-4 max-w-md rounded-3xl bg-white/5 px-8 py-6 text-center shadow-xl shadow-black/40 backdrop-blur-lg"
    >
      <WrappedStyleGlow />

      <div class="text-2xl font-semibold tracking-tight">
        {{ author }}
      </div>

      <div class="mt-6 flex items-end justify-center gap-10">
        <div class="text-left">
          <div class="text-3xl font-bold leading-none text-emerald-300">
            {{
              Math.round(
                data.relativeWords * result.getWordUsage.totalWordCount,
              )
            }}
          </div>
          <div class="mt-1 text-[0.65rem] tracking-[0.25em] text-slate-400">
            {{ t('results.words.breakdown.wordsLabel') }}
          </div>
        </div>

        <div class="text-left">
          <div class="text-3xl font-bold leading-none text-white">
            {{
              Math.round(
                data.relativeMessages * result.getWordUsage.totalMessagesCount,
              )
            }}
          </div>
          <div class="mt-1 text-[0.65rem] tracking-[0.25em] text-slate-400">
            {{ t('results.words.breakdown.messagesLabel') }}
          </div>
        </div>
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
</script>
