<template>
  <WrappedStoryContainer
    class="bg-gradient-to-b from-rose-900/30 via-slate-900/20 to-pink-950"
    :title="t('results.emoji.overTime.stackedTitle')"
  >
    <WrappedStyleSoftOrbs />

    <template v-if="hasData">
      <div class="w-full px-4 mt-8">
        <div class="flex items-end justify-around w-full h-72">
          <div
            v-for="bar in barData"
            :key="bar.month"
            class="flex flex-col items-center"
          >
            <!-- Stacked emojis -->
            <div
              class="flex flex-col-reverse items-center"
              :style="{ height: bar.heightPercent + '%' }"
            >
              <span
                v-for="(emoji, idx) in bar.emojis"
                :key="idx"
                class="text-lg sm:text-xl leading-tight"
              >
                {{ emoji }}
              </span>
            </div>
            <!-- Month label -->
            <span class="text-[0.6rem] text-slate-400 mt-2 whitespace-nowrap">
              {{ prettyMonth(bar.month) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";
import SoftOrbs from "~/components/wrapped/Style/SoftOrbs.vue";
import type { EmojiOverTimeAnalysis } from "~/utils/wrapped/parsing/types";

const statsStore = useStatsStore();
const { result } = storeToRefs(statsStore);
const { t } = useI18n();

const TOP_N = 3; // show top 3 emojis per month
const MAX_EMOJIS_TOTAL = 10; // max emojis to show in tallest bar

const prettyMonth = (value: string) => {
  if (!value || !value.includes("-")) return value;

  const [year, month] = value.split("-");
  const y = Number(year);
  const m = Number(month);

  if (!y || !m) return value;

  const date = new Date(y, m - 1, 1);
  return date.toLocaleString(undefined, { month: "short" });
};

const emojiData = computed(() => {
  return result.value?.getEmojiOverTime as EmojiOverTimeAnalysis | undefined;
});

const hasData = computed(() => {
  return emojiData.value && emojiData.value.sortedMonths.length > 0;
});

const barData = computed(() => {
  const analysis = emojiData.value;
  if (!analysis) return [];

  const { sortedMonths, monthlyTop5 } = analysis;

  // Find the max total count across all months for scaling
  let maxTotal = 0;
  for (const month of sortedMonths) {
    const top3 = (monthlyTop5[month] || []).slice(0, TOP_N);
    const total = top3.reduce((sum, e) => sum + e.count, 0);
    if (total > maxTotal) maxTotal = total;
  }

  if (maxTotal === 0) return [];

  return sortedMonths.map((month) => {
    const top3 = (monthlyTop5[month] || []).slice(0, TOP_N);
    const total = top3.reduce((sum, e) => sum + e.count, 0);

    // Empty month - no emoji data
    if (total === 0) {
      return {
        month,
        emojis: [],
        heightPercent: 0,
      };
    }

    // Scale: how many emojis to show based on relative usage
    const scale = total / maxTotal;
    const totalEmojis = Math.max(1, Math.round(scale * MAX_EMOJIS_TOTAL));

    // Calculate proportional emoji counts for each item
    const emojiCounts = top3.map((item) => ({
      emoji: item.emoji,
      count: 0,
      proportion: item.count / total,
    }));

    // Distribute emojis proportionally using largest remainder method
    // First, give each item its floor share
    let assigned = 0;
    for (const item of emojiCounts) {
      item.count = Math.floor(item.proportion * totalEmojis);
      assigned += item.count;
    }

    // Distribute remaining emojis by highest fractional remainder
    let remaining = totalEmojis - assigned;
    const byRemainder = [...emojiCounts].sort((a, b) => {
      const remA =
        a.proportion * totalEmojis - Math.floor(a.proportion * totalEmojis);
      const remB =
        b.proportion * totalEmojis - Math.floor(b.proportion * totalEmojis);
      return remB - remA;
    });

    for (const item of byRemainder) {
      if (remaining <= 0) break;
      item.count++;
      remaining--;
    }

    // Build the emoji array
    const emojis: string[] = [];
    for (const item of emojiCounts) {
      for (let j = 0; j < item.count; j++) {
        emojis.push(item.emoji);
      }
    }

    return {
      month,
      emojis,
      heightPercent: scale * 100,
    };
  });
});
</script>
