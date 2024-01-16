<template>
  <div ref="chartdiv"></div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";
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
    am4core.options.onlyShowOnViewport = true;

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
    this.series.minFontSize = 12;
    this.series.maxFontSize = 36;
    this.series.minWordLength = 0;
    this.updateGraph();
  },
  beforeDestroy: function () {
    this.chart.dispose();
  },
  methods: {
    updateGraph() {
    this.chartdata.getEmojiCloudData().then((words) => {
      // Regex pattern to match currency like '24,95€'
      const filterPattern = /€\d+([,\.]\d+)?|\d+([,\.]\d+)?€|R\$\d+([,\.]\d+)?|\d+([,\.]\d+)?R\$|\$?\d+([,\.]\d+)?|\d+([,\.]\d+)?\$|₹\d+([,\.]\d+)?|\d+([,\.]\d+)?₹|[!?].*|.*[!?]/;
      
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

<style scoped></style>
