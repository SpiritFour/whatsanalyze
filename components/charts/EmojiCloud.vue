<template>
  <div ref="chartdiv" class="js-svg-chart"></div>
</template>

<script>
import { Chat } from "~/utils/transformChatData";
import { onlyEmoji } from "emoji-aware";

export default {
  name: "EmojiCloud",
  props: {
    chartdata: new Chat(),
    minWordLength: {
      type: Number,
      default: 0,
    },
    minFontSize: {
      type: Number,
      default: 6,
    },
    randomness: {
      type: Number,
      default: 0.1,
    },
  },
  data() {
    return {
      chart: null,
      series: null,
    };
  },
  watch: {
    chartdata: {
      handler() {
        this.updateGraph();
      },
      deep: true,
    },
  },
  mounted() {
    let { am4core, am4themes_animated, am4plugins_wordCloud } = this.$am4core();
    am4core.useTheme(am4themes_animated);
    // Not onlyShowOnViewport: a cloud that has never been scrolled past does
    // not exist yet, and came out as an empty box in the downloaded summary
    // image of someone who hit the button at the top of the page.
    am4core.options.onlyShowOnViewport = false;

    this.chart = am4core.create(
      this.$refs.chartdiv,
      am4plugins_wordCloud.WordCloud
    );
    this.series = this.chart.series.push(
      new am4plugins_wordCloud.WordCloudSeries()
    );
    this.series.dataFields.word = "word";
    this.series.dataFields.value = "freq";
    this.series.labels.template.tooltipText = "[bold]{freq}[/] x {word}";
    this.series.accuracy = 5;
    // Dynamic font scaling based on frequency
    this.series.minFontSize = 18;
    this.series.maxFontSize = 64;
    this.series.minWordLength = 0;
    this.updateGraph();
  },
  beforeUnmount: function () {
    this.chart.dispose();
  },
  methods: {
    updateGraph() {
      this.chartdata.getEmojiCloudData().then((words) => {
        // Currency amounts ("24,95€") and bare currency signs both come back
        // from onlyEmoji as if they were emoji. They are not.
        const filterPattern = /^(?:€|\$|R\$|₹)$|(?:€|\$|R\$|₹)?\d+[,.]?\d*(?:€|\$|R\$|₹)?|[!?]|^\.$/;

        const wordData = words.filter((wordObj) => {
          // Check if the word matches the currency pattern
          const isCurrency = filterPattern.test(wordObj.word);

          // Remove words that are currencies or entirely emojis
          return !isCurrency && onlyEmoji(wordObj.word).length > 0;
        });

        // Assign the filtered data
        this.series.data = wordData;
      });
    },
  },
};
</script>

<style scoped>
/*
 * The chart draws into whatever box this div has. Its height normally comes
 * from a utility class on the tag, but a cloud with no height at all renders
 * nothing at all, so it carries its own floor.
 */
.js-svg-chart {
  width: 100%;
  min-height: 260px;
}
</style>
