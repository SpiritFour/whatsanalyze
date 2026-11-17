<template>
  <WrappedStoryContainer
    v-if="highlights"
    theme="lime"
    :eyebrow="t('results.story.total.eyebrow')"
  >
    <div
      class="total-number story-big story-pop"
      :style="{ '--i': 1, fontSize: numberSize }"
    >
      {{ fmt(shown) }}
    </div>
    <p class="total-unit story-in" style="--i: 2">
      {{ t("results.story.total.unit") }}
    </p>

    <div class="mt-4 flex flex-wrap justify-center gap-2">
      <span class="story-chip story-in" style="--i: 5">
        {{
          t("results.story.total.perDay", {
            count: fmt(highlights.totals.perActiveDay),
          })
        }}
      </span>
      <span class="story-chip story-in" style="--i: 6">
        {{
          t("results.story.total.daysTalked", {
            count: fmt(highlights.totals.daysActive),
          })
        }}
      </span>
      <span class="story-chip story-in" style="--i: 7">
        {{
          t("results.story.total.words", {
            count: fmt(highlights.totals.words),
          })
        }}
      </span>
    </div>

    <p v-if="pages >= 20" class="total-pages story-in" style="--i: 10">
      📖 {{ t("results.story.total.pages", { count: fmt(pages) }) }}
    </p>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import { countUp } from "~/utils/wrapped/story";

const { highlights, fmt, t } = useWrappedStory();

const total = computed(() => highlights.value?.totals.messages ?? 0);
const shown = ref(0);
let stop = () => {};
onMounted(() => {
  stop = countUp(total.value, (value) => (shown.value = value));
});
onBeforeUnmount(() => stop());

// A paperback page holds about 300 words.
const pages = computed(() =>
  Math.round((highlights.value?.totals.words ?? 0) / 300),
);

// Sized by the final number, so counting up does not make it jump.
const numberSize = computed(() => {
  const length = fmt(total.value).length;
  return `min(${Math.min(34, 150 / length)}cqw, 9rem)`;
});
</script>

<style scoped>
.total-number {
  font-size: 5rem;
}

.total-unit {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.total-pages {
  margin: 1.1rem 0 0;
  max-width: 17rem;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
}
</style>
