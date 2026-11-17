<template>
  <WrappedStoryContainer
    v-if="result"
    theme="ink"
    :eyebrow="t('results.story.podium.eyebrow')"
    :title="t('results.emoji.topTitle')"
  >
    <template #bg>
      <!-- left-1/2 undoes the component's own -translate-x-1/2, which is
           there for a parent that centres it. -->
      <WrappedEmojiChaos
        class="left-1/2 top-0 opacity-40"
        :count="22"
        :max-scale="5"
        :emojis="topFive.map((entry) => entry.emoji)"
      />
    </template>

    <WrappedEmojiPodium :top-three-emojies="topFive.slice(0, 3)" />

    <div class="mt-3 flex flex-wrap justify-center gap-2">
      <span
        v-for="(entry, index) in topFive.slice(0, 3)"
        :key="entry.emoji"
        class="story-chip story-in"
        :style="{ '--i': index * 2 + 8 }"
      >
        {{ MEDALS[index] }} {{ fmt(entry.count) }}
      </span>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { useWrappedStory } from "~/composables/useWrappedStory";

const { result, topEmojis, fmt, t } = useWrappedStory();

const MEDALS = ["🥇", "🥈", "🥉"];

const topFive = topEmojis;
</script>
