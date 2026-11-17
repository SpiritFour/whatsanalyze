<template>
  <WrappedStoryContainer
    v-if="stuff"
    theme="cream"
    :eyebrow="t('results.story.stuff.eyebrow')"
    :title="t('results.story.stuff.title')"
  >
    <div v-if="tiles.length" class="stuff-grid" data-testid="stuff">
      <div
        v-for="(tile, index) in tiles"
        :key="tile.kind"
        class="stuff-tile story-card story-in"
        :style="{ '--i': index + 2 }"
      >
        <span class="stuff-tile__emoji">{{ tile.emoji }}</span>
        <span class="stuff-tile__count story-big">{{ fmt(tile.count) }}</span>
        <span class="stuff-tile__label">
          {{ t(`results.story.stuff.kinds.${tile.kind}`) }}
        </span>
      </div>
    </div>

    <div
      v-if="stuff.deleted"
      class="stuff-secret story-in"
      :style="{ '--i': tiles.length + 3 }"
    >
      <p class="stuff-secret__title">
        🗑️
        {{
          t(
            "results.story.stuff.deleted",
            { count: fmt(stuff.deleted) },
            stuff.deleted,
          )
        }}
      </p>
      <p class="stuff-secret__note">
        {{ deletedNote }} {{ t("results.story.stuff.deletedAll") }}
      </p>
    </div>
    <p
      v-if="stuff.edited"
      class="story-chip story-in"
      :style="{ '--i': tiles.length + 4 }"
    >
      ✏️
      {{
        t(
          "results.story.stuff.edited",
          { count: fmt(stuff.edited) },
          stuff.edited,
        )
      }}
    </p>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";
import type { Stuff } from "~/utils/wrapped/parsing/types";

const { highlights, people, isGroup, fmt, t } = useWrappedStory();

const stuff = computed(() => highlights.value?.stuff ?? null);

type TileKind = Exclude<keyof Stuff, "deleted" | "edited">;
const EMOJI: Record<TileKind, string> = {
  photo: "📸",
  voice: "🎤",
  video: "🎬",
  sticker: "🧩",
  gif: "🎞️",
  links: "🔗",
  document: "📎",
  contact: "👤",
  other: "📦",
};

const tiles = computed(() =>
  (Object.keys(EMOJI) as TileKind[])
    .map((kind) => ({
      kind,
      emoji: EMOJI[kind],
      count: stuff.value?.[kind] ?? 0,
    }))
    .filter((tile) => tile.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6),
);

/** Who took them back: one person, all of one person's, or most of them. */
const deletedNote = computed(() => {
  const top = topDeleter.value;
  const total = stuff.value?.deleted ?? 0;
  if (!top) return "";
  const name = top.short;
  if (total === 1) return t("results.story.stuff.deletedOne", { name });
  if (top.deleted === total) {
    return t("results.story.stuff.deletedAllBy", { name });
  }
  return t("results.story.stuff.deletedBy", {
    name,
    count: fmt(top.deleted ?? 0),
  });
});

/** Who deleted most, when it was more than their share. */
const topDeleter = computed(() => {
  const ranked = [...people.value].sort(
    (a, b) => (b.deleted ?? 0) - (a.deleted ?? 0),
  );
  const top = ranked[0];
  if (!top?.deleted) return null;
  if (!isGroup.value && top.deleted === (ranked[1]?.deleted ?? 0)) return null;
  return top;
});
</script>

<style scoped>
.stuff-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  width: 100%;
  max-width: 19rem;
}

.stuff-tile {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.55rem;
  align-items: center;
  padding: 0.65rem 0.8rem;
  text-align: left;
}

.stuff-tile__emoji {
  grid-row: span 2;
  font-size: 1.7rem;
  line-height: 1;
}

.stuff-tile__count {
  font-size: 1.45rem;
  line-height: 1;
}

.stuff-tile__label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--s-muted);
}

.stuff-secret {
  width: 100%;
  max-width: 19rem;
  margin-top: 0.3rem;
  padding: 0.8rem 1rem;
  border-radius: 1.1rem;
  background: var(--s-fg);
  color: var(--s-bg);
  text-align: left;
}

.stuff-secret__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 900;
  color: #fff3d1;
}

.stuff-secret__note {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 243, 209, 0.78);
}
</style>
