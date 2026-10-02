<template>
  <!-- The right gutter keeps the last peak hour clear of the share button the
       card frame floats in this corner. -->
  <div class="wa-scope grid gap-4 pr-11 md:grid-cols-2">
    <div
      v-for="person in card.people"
      :key="person.name"
      class="rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-4"
    >
      <div class="flex items-baseline justify-between gap-3">
        <span class="text-base font-bold" :style="{ color: person.color }">
          {{ person.name }}
        </span>
        <span class="text-lg font-bold text-wa-ink">
          {{ person.peakLabel }}
        </span>
      </div>
      <p v-if="person.badge" class="m-0 mt-1 text-sm text-wa-ink-faint">
        {{ person.badge }}
      </p>

      <!-- One bar per hour of the day, each scaled against that person's own
           busiest hour so a quiet participant still shows a readable shape. -->
      <div class="mt-4 flex h-16 items-end gap-[2px]" aria-hidden="true">
        <div
          v-for="(count, hour) in person.hourly"
          :key="hour"
          class="flex-1 rounded-sm"
          :style="{
            height: `${barHeight(person, count)}%`,
            backgroundColor: person.color,
            opacity: hour === person.peakHour ? 1 : 0.35,
          }"
        ></div>
      </div>
      <div class="mt-1 flex justify-between text-[0.7rem] text-wa-ink-faint">
        <span>00:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HighlightsClock",
  props: {
    card: { type: Object, required: true },
  },
  methods: {
    barHeight(person, count) {
      const busiest = Math.max(...person.hourly);
      // A floor of 4% keeps empty hours visible as a baseline rather than
      // leaving gaps that read as missing data.
      return busiest ? Math.max(4, (count / busiest) * 100) : 4;
    },
  },
};
</script>
