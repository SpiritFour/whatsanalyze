<template>
  <div class="chart-container">
    <Bar v-if="graphData" :data="graphData" :options="chartOptions" />
  </div>
</template>

<script>
import { Bar } from "vue-chartjs";
import "~/utils/chartSetup";
import { Chat } from "~/utils/transformChatData";
import { barOptions } from "~/utils/chartTheme";

export default {
  components: { Bar },
  props: {
    chartdata: {
      type: Object,
      default: () => new Chat(),
    },
    dataGrouping: {
      type: String,
      validator(value) {
        return ["hourly", "daily", "weekly"].includes(value);
      },
      default: "weekly",
    },
    /** Smaller type and no y axis, for the preview on the homepage. */
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
      if (this.options) return this.options;
      return barOptions({
        // Side by side stops being readable once a group gets big; stacking
        // keeps the daily total legible instead.
        stacked: this.chartdata.numPersonsInChat > 4,
        axisLabel: this.$t("messages"),
        compact: this.compact,
      });
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
    async updateGraph() {
      const loaders = {
        hourly: "getHourlyData",
        daily: "getDailyData",
        weekly: "getWeeklyData",
      };
      this.graphData = await this.chartdata[loaders[this.dataGrouping]]();
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
