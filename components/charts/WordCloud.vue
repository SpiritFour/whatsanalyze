<template>
  <div ref="chartdiv"></div>
</template>

<script>
import { Chat } from "~/utils/transformChatData";
import { withoutEmoji } from "emoji-aware";

import stopwords from "stopwords-de";
import { chartFontFamily } from "~/utils/chartTheme";

export default {
  name: "WordCloud",
  props: {
    chartdata: new Chat(),
    minWordLength: {
      type: Number,
      default: 3,
    },
    minFontSize: {
      type: Number,
      default: 6,
    },
    randomness: {
      type: Number,
      default: 0.1,
    },
    stopWords: {
      type: Array,
      default: () => stopwords,
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
    this.series.labels.template.fontFamily = chartFontFamily;
    this.series.accuracy = 4;
    this.series.minFontSize = 10;
    this.series.maxFontSize = 60;
    // The more often a word is used, the deeper the teal: the colour repeats
    // what the size already says instead of handing out eight random hues.
    this.series.heatRules.push({
      target: this.series.labels.template,
      property: "fill",
      min: am4core.color("#8fd8c8"),
      max: am4core.color("#0f6b5a"),
      dataField: "value",
    });
    this.updateGraph();
  },
  beforeUnmount: function () {
    this.chart.dispose();
  },
  methods: {
    updateGraph() {
      this.chartdata.getAllWords().then((words) => {
        const wordData = words.filter((wordObj) => {
          // Remove Emojis
          return withoutEmoji(wordObj.word).length > 0;
        });
        this.series.data = wordData;
      });
    },
  },
};
</script>

<style scoped></style>
