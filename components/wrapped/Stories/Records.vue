<template>
  <WrappedStoryContainer
    v-if="highlights"
    theme="cream"
    :eyebrow="t('results.story.records.eyebrow')"
  >
    <div class="flex w-full max-w-xs flex-col gap-3">
      <div
        v-for="(record, index) in records"
        :key="record.id"
        class="record story-card story-in"
        :style="{ '--i': index * 3 + 1 }"
      >
        <span class="record__emoji">{{ record.emoji }}</span>
        <div class="min-w-0">
          <p class="record__label">{{ record.label }}</p>
          <p class="record__value story-big">{{ record.value }}</p>
          <p class="record__note">{{ record.note }}</p>
        </div>
      </div>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useWrappedStory } from "~/composables/useWrappedStory";

const { highlights, fmt, day, t } = useWrappedStory();

const records = computed(() => {
  const data = highlights.value;
  if (!data) return [];
  const list = [];

  if (data.streak.days >= 2) {
    list.push({
      id: "streak",
      emoji: "🔥",
      label: t("results.story.records.streak.label"),
      value: t("results.story.records.streak.value", {
        count: fmt(data.streak.days),
      }),
      note: t("results.story.records.streak.range", {
        from: day(data.streak.start, "short"),
        to: day(data.streak.end, "short"),
      }),
    });
  }

  // Under a night's sleep it is not a silence worth a card.
  if (data.silence.hours >= 12) {
    list.push({
      id: "silence",
      emoji: "💀",
      label: t("results.story.records.silence.label"),
      value:
        data.silence.days >= 1
          ? t(
              "results.story.records.silence.days",
              { count: fmt(data.silence.days) },
              data.silence.days,
            )
          : t("results.story.records.silence.hours", {
              count: Math.round(data.silence.hours),
            }),
      note: t("results.story.records.silence.note", {
        date: day(data.silence.start),
      }),
    });
  }

  if (data.marathon) {
    const { minutes } = data.marathon;
    list.push({
      id: "marathon",
      emoji: "🏃",
      label: t("results.story.records.marathon.label"),
      value:
        minutes >= 60
          ? t("results.story.time.hm", {
              h: Math.floor(minutes / 60),
              m: minutes % 60,
            })
          : t("results.story.time.minutes", { count: minutes }),
      note: t("results.story.records.marathon.note", {
        count: fmt(data.marathon.messages),
        date: day(data.marathon.date),
      }),
    });
  }

  list.push({
    id: "busiest",
    emoji: "📈",
    label: t("results.story.records.busiest.label"),
    value: day(data.busiestDay.date),
    note: t("results.story.records.busiest.value", {
      count: fmt(data.busiestDay.count),
    }),
  });

  return list;
});
</script>

<style scoped>
.record {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  text-align: left;
}

.record__emoji {
  font-size: 2.4rem;
  line-height: 1;
}

.record__label {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--s-accent);
}

.record__value {
  margin: 0.15rem 0;
  font-size: 1.55rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.record__note {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--s-muted);
}
</style>
