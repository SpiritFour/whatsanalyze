<template>
  <WrappedStoryContainer
    theme="rose"
    :eyebrow="t('results.story.soft.eyebrow')"
    :title="t('results.story.soft.title')"
  >
    <div class="soft-list" data-testid="soft-side">
      <div
        v-for="(row, index) in rows"
        :key="row.kind"
        class="soft-row story-card story-in"
        :style="{ '--i': index * 2 + 2 }"
      >
        <span class="soft-row__emoji">{{ EMOJI[row.kind] }}</span>
        <div class="soft-row__body">
          <p class="soft-row__label">
            {{ t(`results.story.soft.kinds.${row.kind}`) }}
          </p>
          <div class="soft-row__people">
            <span
              v-for="(entry, place) in row.people"
              :key="entry.name"
              class="soft-row__person"
              :class="{ 'soft-row__person--top': place === 0 }"
            >
              {{ entry.short }}
              <b>{{ fmt(entry.count) }}</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import type { PhraseKind } from "~/utils/wrapped/parsing/types";

const { people, fmt, t } = useWrappedStory();

const EMOJI: Record<PhraseKind, string> = {
  love: "❤️",
  miss: "🥺",
  sorry: "🙏",
  night: "🌙",
  morning: "☀️",
};
const KINDS: PhraseKind[] = ["love", "miss", "sorry", "night", "morning"];

/**
 * What was said at least a few times, most-said first within each, the four
 * that were said most.
 */
const rows = computed(() =>
  KINDS.map((kind) => {
    const counts = people.value
      .map((person) => ({
        name: person.name,
        short: person.short,
        count: person.phrases?.[kind] ?? 0,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
    const total = counts.reduce((sum, entry) => sum + entry.count, 0);
    return { kind, total, people: counts.slice(0, 3) };
  })
    .filter((row) => row.total >= 3)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
    .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind)),
);
</script>

<style scoped>
.soft-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 100%;
  max-width: 19rem;
  margin-top: 0.3rem;
}

.soft-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 0.9rem;
  text-align: left;
}

.soft-row__emoji {
  font-size: 1.9rem;
  line-height: 1;
}

.soft-row__body {
  min-width: 0;
}

.soft-row__label {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.1;
}

.soft-row__people {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--s-muted);
}

.soft-row__person b {
  margin-left: 0.15rem;
  font-weight: 900;
  color: var(--s-fg);
}

.soft-row__person--top b {
  color: var(--s-accent);
}
</style>
