<template>
  <div class="wa-scope flex flex-col gap-5">
    <div v-for="person in card.people" :key="person.name">
      <p class="m-0 text-base font-bold" :style="{ color: person.color }">
        {{ person.name }}
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="entry in person.words"
          :key="entry.word"
          class="rounded-full border border-solid px-3 py-1.5 text-sm font-semibold"
          :style="{ borderColor: person.color, color: person.color }"
        >
          {{ entry.word
          }}<template v-if="entry.count"> ×{{ entry.count }}</template>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HighlightsSignatureWords",
  props: {
    card: { type: Object, required: true },
  },
};
</script>
