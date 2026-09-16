<template>
  <div class="wa-scope grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="stat in card.stats"
      :key="stat.label"
      class="rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-5 text-left shadow-card"
    >
      <p
        class="m-0 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-wa-ink-faint"
      >
        {{ stat.label }}
      </p>
      <p
        class="m-0 mt-2 text-2xl font-bold leading-tight text-wa-ink md:text-3xl"
      >
        {{ stat.value }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "HighlightsStats",
  props: {
    card: { type: Object, required: true },
  },
};
</script>
