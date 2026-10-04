<template>
  <div class="contents">
    <ChartsCard
      v-for="card in cards"
      :key="card.id"
      :title="card.title"
      :subtitle="card.kicker"
    >
      <Share :id="`highlight-${card.id}`" :title="card.title">
        <HighlightsBody :card="card" />
      </Share>
    </ChartsCard>
  </div>
</template>

<script>
import { buildSocialCards, socialStatsFor } from "~/utils/social/cardData";

/**
 * The per-person highlights on the results page: who talks more, who is up
 * late, the emoji podium and the words only one person uses. Each sits in the
 * same card frame as every chart and shares through the same button.
 */
export default {
  name: "HighlightsSection",
  props: {
    chat: { type: Object, required: true },
    // The overview duplicates ChartsTextStats above it on the results page.
    exclude: { type: Array, default: () => [] },
  },
  computed: {
    cards() {
      return buildSocialCards(socialStatsFor(this.chat), {
        t: this.$t.bind(this),
        locale: this.$i18n.locale,
      }).filter((card) => !this.exclude.includes(card.id));
    },
  },
};
</script>
