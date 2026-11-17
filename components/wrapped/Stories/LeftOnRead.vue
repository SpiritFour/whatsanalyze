<template>
  <WrappedStoryContainer
    theme="night"
    :eyebrow="t('results.story.left.eyebrow')"
    :title="t('results.story.left.title')"
  >
    <div class="flex w-full max-w-xs flex-col gap-3">
      <div v-if="burst" class="left-card story-card story-in" style="--i: 2">
        <p class="left-card__label">
          {{ t("results.story.left.burst.label") }}
        </p>
        <p class="left-card__value story-big">
          {{ t("results.story.left.burst.value", { count: fmt(burst.count) }) }}
        </p>
        <div class="left-bubbles" aria-hidden="true">
          <span
            v-for="index in Math.min(burst.count, 8)"
            :key="index"
            class="left-bubbles__one"
            :style="{ animationDelay: `${index * 80 + 400}ms` }"
          />
        </div>
        <p class="left-card__note">
          {{
            t("results.story.left.burst.note", {
              name: nameOf(burst.author),
              date: day(burst.date),
            })
          }}
        </p>
      </div>

      <div v-if="waited" class="left-card story-card story-in" style="--i: 4">
        <p class="left-card__label">
          {{ t("results.story.left.waited.label") }}
        </p>
        <p class="left-question">{{ waited.text }}</p>
        <p class="left-card__note">
          ⏳
          {{
            t("results.story.left.waited.note", {
              name: nameOf(waited.author),
              time: duration(waited.minutes),
              other: nameOf(waited.answeredBy),
            })
          }}
        </p>
      </div>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import { shortName } from "~/utils/wrapped/story";

const { highlights, people, fmt, day, duration, t } = useWrappedStory();

const burst = computed(() => highlights.value?.burst ?? null);
const waited = computed(() => highlights.value?.waited ?? null);

const nameOf = (name: string) =>
  people.value.find((person) => person.name === name)?.short ?? shortName(name);
</script>

<style scoped>
.left-card {
  padding: 0.85rem 1rem 0.9rem;
  text-align: left;
}

.left-card__label {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--s-accent);
}

.left-card__value {
  margin: 0.2rem 0 0.4rem;
  font-size: 1.7rem;
  line-height: 1.05;
}

.left-card__note {
  margin: 0.45rem 0 0;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-muted);
}

.left-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.left-bubbles__one {
  width: 1.6rem;
  height: 0.75rem;
  border-radius: 0.5rem 0.5rem 0.5rem 0.15rem;
  background: #d9fdd3;
  animation: left-pop 0.4s cubic-bezier(0.3, 1.5, 0.5, 1) both;
}

.left-question {
  display: inline-block;
  margin: 0.45rem 0 0;
  padding: 0.55rem 0.8rem;
  border-radius: 1rem 1rem 1rem 0.3rem;
  background: #ffffff;
  color: #1a1238;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

@keyframes left-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .left-bubbles__one {
    animation: none;
  }
}
</style>
