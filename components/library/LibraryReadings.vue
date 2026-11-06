<template>
  <!-- A saved chat's AI readings, newest first, each with its date: the one
       on screen and the ones before it (docs/saved-chats.md, step 2). -->
  <nav class="library-readings" :aria-label="t('library.readingsTitle')">
    <h3 class="library-readings__title">
      <v-icon size="18">mdi-sort-clock-ascending-outline</v-icon>
      {{ t("library.readingsTitle") }}
    </h3>
    <ul class="library-readings__list">
      <li v-for="reading in readings" :key="reading.id">
        <button
          type="button"
          class="library-readings__item"
          :class="{ 'library-readings__item--on': reading.id === current }"
          :aria-current="reading.id === current ? 'true' : undefined"
          @click="emit('select', reading)"
        >
          <span class="library-readings__date mono-label">
            {{ date(reading.createdAt) }}
          </span>
          <span class="library-readings__question">
            {{ reading.report.question || t("library.readingGeneral") }}
          </span>
          <span class="library-readings__where">{{ where(reading) }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { SavedReading } from "~/composables/useLibrary";

defineProps<{
  readings: SavedReading[];
  /** The reading on screen. */
  current: string | null;
}>();
const emit = defineEmits<{ select: [reading: SavedReading] }>();

const { t, locale } = useI18n();

const date = (time: number) =>
  new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(time));

const where = (reading: SavedReading) =>
  t(
    reading.report.ranOn === "local"
      ? "library.ranLocal"
      : reading.report.locked
        ? "library.ranPreview"
        : "library.ranCloud",
  );
</script>

<style lang="scss" scoped>
.library-readings {
  display: grid;
  gap: 0.6rem;
}

.library-readings__title {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  color: $wa-ink;
}

.library-readings__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.library-readings__item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3rem 0.8rem;
  width: 100%;
  padding: 0.6rem 0.9rem;
  border-radius: $wa-radius-md;
  border: 1px solid $wa-border;
  background: $wa-surface-white;
  color: $wa-ink;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: $wa-accent;
  }

  &--on {
    border-color: $wa-accent;
    background: $wa-accent-soft;
  }
}

.library-readings__date {
  font-size: 0.75rem;
  color: $wa-ink-muted;
}

.library-readings__question {
  flex: 1 1 12rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.library-readings__where {
  font-size: 0.8rem;
  color: $wa-ink-muted;
}
</style>
