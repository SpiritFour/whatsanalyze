<template>
  <WrappedStoryContainer
    v-if="funniest"
    theme="lime"
    :eyebrow="t('results.story.funniest.eyebrow')"
    :title="t('results.story.funniest.title')"
  >
    <figure class="funny-quote story-pop" style="--i: 2">
      <blockquote class="funny-quote__text">{{ funniest.text }}</blockquote>
      <figcaption class="funny-quote__meta">
        <strong>{{ author }}</strong>
        <span>{{ day(funniest.date) }}</span>
      </figcaption>
    </figure>

    <div class="funny-laughs story-in" style="--i: 5" aria-hidden="true">
      <span
        v-for="index in emojiCount"
        :key="index"
        class="funny-laughs__emoji"
        :style="{ animationDelay: `${index * 90 + 700}ms` }"
        >😂</span
      >
    </div>
    <p class="funny-note story-in" style="--i: 6">
      {{ t("results.story.funniest.note") }}
    </p>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import { shortName } from "~/utils/wrapped/story";

const { highlights, people, day, t } = useWrappedStory();

const funniest = computed(() => highlights.value?.funniest ?? null);
const author = computed(() => {
  const name = funniest.value?.author ?? "";
  return (
    people.value.find((person) => person.name === name)?.short ??
    shortName(name)
  );
});
// The harder the laugh, the more of them: one to five.
const emojiCount = computed(() =>
  Math.min(5, Math.max(1, Math.round(funniest.value?.strength ?? 1))),
);
</script>

<style scoped>
.funny-quote {
  position: relative;
  max-width: 18rem;
  margin: 0.6rem 0 0;
  padding: 1rem 1.15rem 0.85rem;
  border-radius: 1.4rem;
  border-bottom-left-radius: 0.35rem;
  background: #ffffff;
  color: #10210f;
  text-align: left;
  box-shadow: 0 14px 0 rgba(16, 33, 15, 0.16);
  rotate: -2deg;
}

.funny-quote__text {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.22;
  overflow-wrap: anywhere;
}

.funny-quote__text::before {
  content: "“";
}

.funny-quote__text::after {
  content: "”";
}

.funny-quote__meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.6rem;
  font-size: 0.75rem;
  opacity: 0.6;
}

.funny-laughs {
  display: flex;
  gap: 0.2rem;
  margin-top: 0.9rem;
  font-size: 2rem;
}

.funny-laughs__emoji {
  display: inline-block;
  animation: funny-bounce 0.9s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}

.funny-note {
  margin: 0;
  max-width: 16rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--s-muted);
}

@keyframes funny-bounce {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.4) rotate(-20deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .funny-laughs__emoji {
    animation: none;
  }
}
</style>
