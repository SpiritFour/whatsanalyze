<template>
  <div class="hello" ref="chartdiv"></div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud";
import { Chat } from "~/functions/transformChatData";

am4core.useTheme(am4themes_animated);

export default {
  name: "WordCloud",
  props: {
    chartdata: new Chat(),
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
  methods: {
    updateGraph() {
      this.series.text = this.chartdata.getAllWords();
    },
  },
  mounted() {
    this.chart = am4core.create(
      this.$refs.chartdiv,
      am4plugins_wordCloud.WordCloud
    );
    this.series = this.chart.series.push(
      new am4plugins_wordCloud.WordCloudSeries()
    );
    this.updateGraph();
  },
};
</script>

<style scoped></style>
