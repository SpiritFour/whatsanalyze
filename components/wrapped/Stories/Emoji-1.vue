<template>
  <WrappedStoryContainer
    v-if="result"
    class="bg-black text-6xl"
    :title="t('results.emoji.topTitle')"
  >
    <WrappedEmojiChaos
      :count="50"
      :emojis="result.getMostUsedEmojis.globalTop5Emojis.map((m) => m.emoji)"
    />

    <WrappedEmojiPodium :top-three-emojies="topThreeEmojies" />
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";

const statsStore = useStatsStore();

const { result } = storeToRefs(statsStore);
const { t } = useI18n();

const topThreeEmojies = computed(() => {
  if (!result.value) return [];
  return result.value.getMostUsedEmojis.globalTop5Emojis.slice(0, 3);
});
</script>
