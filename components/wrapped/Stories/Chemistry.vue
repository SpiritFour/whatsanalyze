<template>
  <WrappedStoryContainer
    v-if="chemistry"
    theme="mint"
    :eyebrow="t('results.story.chemistry.eyebrow')"
    :title="t('results.story.chemistry.title', { names: chatTitle() })"
  >
    <div class="sync-score story-big story-pop" style="--i: 2">
      {{ shown }}<span class="sync-score__unit">%</span>
    </div>
    <p class="sync-label story-in" style="--i: 3">
      {{ t("results.story.chemistry.unit") }} ·
      {{ t(`results.story.chemistry.bands.${band}`) }}
    </p>

    <div class="sync-parts" data-testid="chemistry">
      <div
        v-for="(part, index) in parts"
        :key="part.id"
        class="sync-part story-in"
        :style="{ '--i': index + 4 }"
      >
        <span class="sync-part__label">
          {{ t(`results.story.chemistry.parts.${part.id}`) }}
        </span>
        <span class="sync-part__track">
          <span
            class="sync-part__fill"
            :style="{
              width: `${part.value}%`,
              animationDelay: `${index * 90 + 600}ms`,
            }"
          />
        </span>
        <span class="sync-part__value">{{ part.value }}</span>
      </div>
    </div>

    <button
      v-if="!isSample"
      type="button"
      class="story-btn story-btn--small story-in mt-1"
      style="--i: 10"
      :disabled="card.busy.value || !card.ready.value"
      @click="card.share"
    >
      {{ t("results.story.card.share") }}
    </button>
    <p v-if="card.statusText.value" class="text-xs font-semibold">
      {{ card.statusText.value }}
    </p>
    <p class="sync-note story-in" style="--i: 11">
      {{ t("results.story.chemistry.note") }}
    </p>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useWrappedCard, useWrappedStory } from "~/composables/useWrappedStory";
import { countUp, useStoryContext } from "~/utils/wrapped/story";

const { highlights, chatTitle, t } = useWrappedStory();
// The sample chat is nobody's to post, as on the closing slide.
const context = useStoryContext();
const isSample = computed(() => context?.isSample.value ?? false);
const card = useWrappedCard("sync");

const chemistry = computed(() => highlights.value?.chemistry ?? null);

type ChemistryPart = "balance" | "starts" | "presence" | "reply" | "laughs";
const ORDER: ChemistryPart[] = [
  "balance",
  "starts",
  "reply",
  "laughs",
  "presence",
];

const parts = computed(() =>
  ORDER.map((id) => ({ id, value: chemistry.value?.parts[id] ?? null })).filter(
    (part): part is { id: ChemistryPart; value: number } =>
      Number.isFinite(part.value),
  ),
);

const band = computed(() => {
  const score = chemistry.value?.score ?? 0;
  if (score >= 90) return "one";
  if (score >= 78) return "strong";
  if (score >= 65) return "good";
  return "opposites";
});

const shown = ref(0);
let stop = () => {};
onMounted(() => {
  stop = countUp(chemistry.value?.score ?? 0, (value) => (shown.value = value));
});
onBeforeUnmount(() => stop());
</script>

<style scoped>
.sync-score {
  font-size: 6.5rem;
  font-size: min(32cqw, 8rem);
}

.sync-score__unit {
  font-size: 0.45em;
  letter-spacing: 0;
}

.sync-label {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 900;
}

.sync-parts {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
  max-width: 18rem;
}

.sync-part {
  display: grid;
  grid-template-columns: 7.4rem 1fr 2rem;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: left;
}

.sync-part__track {
  height: 0.6rem;
  border-radius: 9999px;
  background: var(--s-card);
  overflow: hidden;
}

.sync-part__fill {
  display: block;
  height: 100%;
  border-radius: 9999px;
  background: var(--s-fg);
  transform-origin: left;
  animation: sync-grow 0.8s cubic-bezier(0.2, 0.9, 0.3, 1) both;
}

.sync-part__value {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.sync-note {
  margin: 0.2rem 0 0;
  max-width: 17rem;
  font-size: 0.66rem;
  line-height: 1.3;
  color: var(--s-muted);
}

@keyframes sync-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sync-part__fill {
    animation: none;
  }
}
</style>
