<template>
  <div class="wa-scope flex flex-col gap-6">
    <!-- The right gutter keeps the second name clear of the share button the
         card frame floats in this corner. -->
    <div class="flex items-baseline justify-between gap-4 pr-11">
      <span class="text-base font-bold" :style="{ color: left.color }">
        {{ left.name }}
      </span>
      <span class="text-base font-bold" :style="{ color: right.color }">
        {{ right.name }}
      </span>
    </div>

    <div v-for="row in card.rows" :key="row.label" class="flex flex-col gap-2">
      <p class="m-0 text-center text-sm text-wa-ink-faint">{{ row.label }}</p>

      <div class="flex h-3 overflow-hidden rounded-full bg-wa-surface-muted">
        <div
          :style="{ width: `${row.percents[0]}%`, backgroundColor: left.color }"
        ></div>
        <div
          :style="{
            width: `${row.percents[1]}%`,
            backgroundColor: right.color,
          }"
        ></div>
      </div>

      <div class="flex justify-between text-sm font-semibold">
        <span :style="{ color: left.color }">{{ sideLabel(row, 0) }}</span>
        <span :style="{ color: right.color }">{{ sideLabel(row, 1) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HighlightsDuel",
  props: {
    card: { type: Object, required: true },
  },
  computed: {
    left() {
      return this.card.contenders[0];
    },
    right() {
      return this.card.contenders[1];
    },
  },
  methods: {
    // With counts hidden the card carries percentages alone, which is the
    // whole point of the privacy toggle.
    sideLabel(row, index) {
      const percent = `${row.percents[index]}%`;
      return row.values ? `${percent} · ${row.values[index]}` : percent;
    },
  },
};
</script>
