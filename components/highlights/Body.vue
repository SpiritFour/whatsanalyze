<template>
  <component :is="bodyComponent" v-if="bodyComponent" :card="card" />
</template>

<script>
import HighlightsClock from "~/components/highlights/Clock.vue";
import HighlightsDuel from "~/components/highlights/Duel.vue";
import HighlightsEmojiPodium from "~/components/highlights/EmojiPodium.vue";
import HighlightsSignatureWords from "~/components/highlights/SignatureWords.vue";
import HighlightsStats from "~/components/highlights/Stats.vue";

/**
 * Picks the body for a card descriptor from utils/social/cardData, so the
 * results page and a shared link render the same highlights from the same
 * data without either knowing which kinds exist.
 */
const BODIES = {
  stats: HighlightsStats,
  duel: HighlightsDuel,
  clock: HighlightsClock,
  emoji: HighlightsEmojiPodium,
  words: HighlightsSignatureWords,
};

export default {
  name: "HighlightsBody",
  props: {
    card: { type: Object, required: true },
  },
  computed: {
    bodyComponent() {
      return BODIES[this.card.type] || null;
    },
  },
};
</script>
