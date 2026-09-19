<template>
  <div class="chart-container">
    <Radar v-if="graphData" :data="graphData" :options="chartOptions" />
  </div>
</template>

<script>
import { Radar } from "vue-chartjs";
import { Chat } from "~/utils/transformChatData";
import { updateAlpha } from "~/utils/colors";
import { radarOptions } from "~/utils/chartTheme";

export default {
  components: { Radar },
  props: {
    dataGrouping: {
      type: String,
      validator(value) {
        return ["hourly", "daily", "weekly"].includes(value);
      },
      default: "weekly",
    },
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
      return this.options || radarOptions({ compact: this.compact });
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
    /** Overlapping webs: the fill has to stay see-through, the outline does not. */
    softenFill(data) {
      return {
        ...data,
        datasets: data.datasets.map((dataset) => ({
          ...dataset,
          backgroundColor: updateAlpha(dataset.backgroundColor, 0.12),
          pointBackgroundColor: dataset.borderColor,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1.5,
        })),
      };
    },
    async updateGraph() {
      const loaders = {
        hourly: "getHourlyData",
        daily: "getDailyData",
        weekly: "getWeeklyData",
      };
      const data = await this.chartdata[loaders[this.dataGrouping]]();
      this.graphData = this.softenFill(data);
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
