<template>
  <WrappedStoryContainer
    theme="sunset"
    :eyebrow="t('results.story.age.eyebrow')"
    :title="t('results.story.age.title')"
  >
    <div
      class="age-list"
      :class="{ 'age-list--compact': aged.length > 2 }"
      data-testid="texting-age"
    >
      <div
        v-for="(person, index) in aged"
        :key="person.name"
        class="age-person story-card story-in"
        :style="{ '--i': index * 2 + 2 }"
      >
        <div class="age-person__text">
          <p class="age-person__name">{{ person.short }}</p>
          <p class="age-person__why">{{ ageReasons(person) }}</p>
        </div>
        <div class="age-person__age story-big">
          {{ shown[index] ?? person.age }}
        </div>
      </div>
    </div>

    <p v-if="verdict" class="age-verdict story-in" style="--i: 7">
      {{ verdict }}
    </p>

    <button
      v-if="!isSample"
      type="button"
      class="story-btn story-btn--small story-in mt-1"
      style="--i: 9"
      :disabled="card.busy.value || !card.ready.value"
      @click="card.share"
    >
      {{ t("results.story.card.share") }}
    </button>
    <p v-if="card.statusText.value" class="text-xs font-semibold">
      {{ card.statusText.value }}
    </p>
    <p class="age-note story-in" style="--i: 10">
      {{ t("results.story.age.note") }}
    </p>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useWrappedCard, useWrappedStory } from "~/composables/useWrappedStory";
import { countUp, useStoryContext } from "~/utils/wrapped/story";

const { people, ageReasons, t } = useWrappedStory();
// The sample chat is nobody's to post, as on the closing slide.
const context = useStoryContext();
const isSample = computed(() => context?.isSample.value ?? false);
const card = useWrappedCard("age");

const aged = computed(() =>
  people.value.filter((person) => person.age !== null).slice(0, 4),
);

const shown = ref<number[]>([]);
const stops: Array<() => void> = [];
onMounted(() => {
  aged.value.forEach((person, index) => {
    stops.push(
      countUp(
        person.age ?? 0,
        (value) => (shown.value[index] = value),
        1100 + index * 250,
      ),
    );
  });
});
onBeforeUnmount(() => stops.forEach((stop) => stop()));

const verdict = computed(() => {
  if (aged.value.length < 2) return "";
  const byAge = [...aged.value].sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
  const oldest = byAge[0];
  const youngest = byAge[byAge.length - 1];
  if ((oldest.age ?? 0) - (youngest.age ?? 0) < 6) {
    return t("results.story.age.same");
  }
  return t("results.story.age.older", { name: oldest.short });
});
</script>

<style scoped>
.age-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  max-width: 19rem;
  margin-top: 0.4rem;
}

.age-person {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  text-align: left;
}

.age-person__text {
  min-width: 0;
}

.age-person__name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.age-person__why {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.25;
  color: var(--s-muted);
}

.age-person__age {
  font-size: 4.2rem;
  color: var(--s-accent);
  text-shadow: 0 4px 0 rgba(0, 0, 0, 0.18);
}

.age-list--compact .age-person {
  padding: 0.45rem 0.9rem;
}

.age-list--compact .age-person__name {
  font-size: 1.05rem;
}

.age-list--compact .age-person__age {
  font-size: 2.6rem;
}

.age-verdict {
  margin: 0.4rem 0 0.2rem;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.2;
}

.age-note {
  margin: 0.2rem 0 0;
  max-width: 17rem;
  font-size: 0.66rem;
  line-height: 1.3;
  color: var(--s-muted);
}
</style>
