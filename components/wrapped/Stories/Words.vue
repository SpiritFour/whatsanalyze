<template>
  <WrappedStoryContainer
    theme="rose"
    :eyebrow="t('results.story.words.eyebrow')"
    :title="t('results.story.words.title')"
  >
    <div class="flex w-full max-w-xs flex-col gap-3">
      <div
        v-for="(person, index) in speakers"
        :key="person.name"
        class="words story-card story-in"
        :style="{ '--i': index * 2 + 2 }"
      >
        <p class="words__name">{{ person.short }}</p>
        <p class="words__top story-big">{{ person.words3[0].word }}</p>
        <div class="flex flex-wrap justify-center gap-1.5">
          <span class="story-chip">×{{ fmt(person.words3[0].count) }}</span>
          <span
            v-for="entry in person.words3.slice(1)"
            :key="entry.word"
            class="story-chip"
          >
            {{ entry.word }} ×{{ fmt(entry.count) }}
          </span>
        </div>
      </div>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";

const { people, fmt, t } = useWrappedStory();

const speakers = computed(() =>
  people.value.filter((person) => person.words3.length).slice(0, 3),
);
</script>

<style scoped>
.words {
  padding: 0.75rem 1rem 0.85rem;
}

.words__name {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--s-accent);
}

.words__top {
  margin: 0.15rem 0 0.5rem;
  font-size: 2rem;
  line-height: 1.05;
  overflow-wrap: anywhere;
}
</style>
