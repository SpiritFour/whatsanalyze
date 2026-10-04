<template>
  <div class="wa-scope flex flex-col gap-5">
    <div v-for="person in card.people" :key="person.name">
      <p class="m-0 text-base font-bold" :style="{ color: person.color }">
        {{ person.name }}
      </p>
      <div class="mt-2 flex flex-wrap gap-4">
        <div
          v-for="(entry, index) in person.emojis"
          :key="entry.emoji"
          class="text-center"
        >
          <!-- The most used emoji is drawn largest, so the ranking reads
               without needing the numbers underneath. -->
          <div :class="index === 0 ? 'text-4xl' : 'text-3xl'">
            {{ entry.emoji }}
          </div>
          <div v-if="entry.count" class="text-sm text-wa-ink-faint">
            {{ entry.count }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HighlightsEmojiPodium",
  props: {
    card: { type: Object, required: true },
  },
};
</script>
