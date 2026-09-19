<template>
  <div class="chart-container">
    <Line v-if="graphData" :data="graphData" :options="chartOptions" />
  </div>
</template>

<script>
import { Line } from "vue-chartjs";
import { Chat } from "~/utils/transformChatData";
import { lineOptions } from "~/utils/chartTheme";
import { accentColor, hexToRgbA } from "~/utils/colors";

export default {
  components: { Line },
  props: {
    chartdata: {
      type: Object,
      default: () => new Chat(),
    },
    compact: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      graphData: null,
    };
  },
  computed: {
    chartOptions() {
      return (
        this.options ||
        lineOptions({ axisLabel: this.$t("messages"), compact: this.compact })
      );
    },
  },
  watch: {
    chartdata: {
      handler: "updateGraph",
      deep: true,
      immediate: true,
    },
  },
  methods: {
    /**
     * The area under the line fades out downwards, so a year of daily counts
     * reads as a shape instead of a solid block.
     */
    fadeUnderLine(context) {
      const { chart } = context;
      const { ctx, chartArea } = chart;
      if (!chartArea) return hexToRgbA(accentColor, 0.2);

      const gradient = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom
      );
      gradient.addColorStop(0, hexToRgbA(accentColor, 0.28));
      gradient.addColorStop(1, hexToRgbA(accentColor, 0));
      return gradient;
    },
    async updateGraph() {
      const data = await this.chartdata.getLineGraphData();
      if (!data) return;
      this.graphData = {
        ...data,
        datasets: data.datasets.map((dataset) => ({
          ...dataset,
          fill: true,
          borderColor: accentColor,
          backgroundColor: this.fadeUnderLine,
          pointBackgroundColor: accentColor,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        })),
      };
    },
  },
};
</script>

<style scoped>
/*
 * Chart.js reads its size from this box. It must not carry a percentage
 * max-width on the canvas: Chart.js resolves that against the canvas' own
 * current width, so the chart gets locked at whatever size it was created
 * with — which is why every chart used to render 300px wide.
 */
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
