<template>
  <WrappedStoryContainer
    v-if="highlights"
    theme="night"
    :eyebrow="t('results.story.clock.eyebrow')"
    :title="t(`results.story.clock.types.${highlights.chronotype}`)"
  >
    <div class="clock story-in" style="--i: 2">
      <div class="clock__bars">
        <span
          v-for="(bar, index) in bars"
          :key="index"
          class="clock__bar"
          :class="{ 'clock__bar--peak': bar.peak }"
          :style="{
            height: `${bar.height}%`,
            animationDelay: `${index * 28 + 250}ms`,
          }"
        />
      </div>
      <div class="clock__axis">
        <span v-for="tick in ticks" :key="tick">{{ hour(tick) }}</span>
      </div>
    </div>

    <div class="mt-3 flex flex-col items-center gap-2">
      <span class="story-chip story-in" style="--i: 6">
        ⏰
        {{ t("results.story.clock.peak", { hour: hour(highlights.peakHour) }) }}
      </span>
      <span
        v-if="afterMidnight >= 1"
        class="story-chip story-in"
        style="--i: 8"
      >
        🌙
        {{ t("results.story.clock.afterMidnight", { percent: afterMidnight }) }}
      </span>
      <span v-if="latest" class="story-chip story-in" style="--i: 9">
        🦉
        {{
          t("results.story.clock.latest", {
            name: latest.name,
            time: clock(latest.hour, latest.minute),
            date: day(latest.date),
          })
        }}
      </span>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import { shortName } from "~/utils/wrapped/story";

const { highlights, people, hour, clock, day, t } = useWrappedStory();

/** The latest anyone was still writing, from one o'clock on. */
const latest = computed(() => {
  const night = highlights.value?.latestNight;
  if (!night || night.hour < 1) return null;
  const name =
    people.value.find((person) => person.name === night.author)?.short ??
    shortName(night.author);
  return { ...night, name };
});

const ticks = [0, 6, 12, 18];

const bars = computed(() => {
  const hours = highlights.value?.hours ?? [];
  const max = Math.max(1, ...hours);
  return hours.map((count, index) => ({
    // A sliver for the empty hours, so the day still reads as 24 of them.
    height: Math.max(3, (count / max) * 100),
    peak: index === highlights.value?.peakHour,
  }));
});

const afterMidnight = computed(() =>
  Math.round((highlights.value?.afterMidnightShare ?? 0) * 100),
);
</script>

<style scoped>
.clock {
  width: 100%;
  max-width: 19rem;
  margin-top: 0.75rem;
}

.clock__bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 9.5rem;
}

.clock__bar {
  flex: 1;
  border-radius: 4px 4px 2px 2px;
  background: rgba(255, 255, 255, 0.45);
  transform-origin: bottom;
  animation: clock-grow 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.1) both;
}

.clock__bar--peak {
  background: var(--s-accent);
  box-shadow: 0 0 18px var(--s-accent);
}

.clock__axis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--s-muted);
  text-align: left;
}

@keyframes clock-grow {
  from {
    transform: scaleY(0);
  }
  to {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .clock__bar {
    animation: none;
  }
}
</style>
