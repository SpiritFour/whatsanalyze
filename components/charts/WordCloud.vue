<template>
  <div ref="chartdiv"></div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";

import stopwords from "stopwords-de";

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
  methods: {
    updateGraph() {
      this.chartdata.getAllWords().then((x) => (this.series.data = x));
    },
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
    this.updateGraph();
  },
  beforeDestroy: function () {
    this.chart.dispose();
  },
};
</script>

<style scoped></style>
