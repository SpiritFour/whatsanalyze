<template>
  <WrappedStoryContainer theme="ink">
    <template #bg>
      <span
        v-for="(floater, index) in floaters"
        :key="index"
        class="cover-floater"
        :style="floater.style"
      >
        {{ floater.emoji }}
      </span>
    </template>

    <p class="story-eyebrow story-in">WhatsApp Wrapped</p>
    <div class="cover-year story-big story-pop" style="--i: 1">{{ year }}</div>
    <p class="cover-names story-in" style="--i: 3">{{ title }}</p>
    <p class="story-muted story-in" style="--i: 4">
      {{ t("results.story.cover.kicker") }}
    </p>
    <p v-if="isSample" class="story-chip story-in mt-2" style="--i: 5">
      {{ t("results.story.sampleBadge") }}
    </p>
    <p class="cover-hint story-in" style="--i: 8">
      {{ t("results.story.hint") }}
    </p>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import { useStoryContext } from "~/utils/wrapped/story";

const { topEmojis, year, names, chatTitle, t } = useWrappedStory();
const context = useStoryContext();
const isSample = computed(() => context?.isSample.value ?? false);

const title = computed(() => (names.value.length ? chatTitle() : ""));

// The chat's own favourite emoji, drifting behind the year.
const SPOTS = [
  { left: "8%", top: "16%", size: 2.6, delay: 0 },
  { left: "76%", top: "12%", size: 2, delay: -3 },
  { left: "82%", top: "58%", size: 3, delay: -1.5 },
  { left: "6%", top: "66%", size: 2.2, delay: -4.5 },
  { left: "44%", top: "82%", size: 1.8, delay: -2.2 },
];
const floaters = computed(() => {
  const emojis = topEmojis.value.map((entry) => entry.emoji);
  if (!emojis.length) return [];
  return SPOTS.map((spot, index) => ({
    emoji: emojis[index % emojis.length],
    style: {
      left: spot.left,
      top: spot.top,
      fontSize: `${spot.size}rem`,
      animationDelay: `${spot.delay}s`,
    },
  }));
});
</script>

<style scoped>
.cover-year {
  font-size: 7rem;
  font-size: min(36cqw, 11rem);
  background: linear-gradient(115deg, #d6ff3f 0%, #25d366 55%, #7df9c9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding: 0.05em 0.04em;
}

.cover-names {
  margin: 0.25rem 0 0;
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.cover-hint {
  position: absolute;
  bottom: 1.5rem;
  left: 0;
  right: 0;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--s-muted);
}

.cover-floater {
  position: absolute;
  opacity: 0.5;
  animation: cover-float 7s ease-in-out infinite alternate;
}

@keyframes cover-float {
  from {
    transform: translateY(0) rotate(-8deg);
  }
  to {
    transform: translateY(-22px) rotate(10deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-floater {
    animation: none;
  }
}
</style>
