<template>
  <div class="chart-container">
    <Bar v-if="graphData" :data="graphData" :options="chartOptions" />
  </div>
</template>

<script>
import { Bar } from "vue-chartjs";
import { Chat } from "~/utils/transformChatData";

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

      const stacked = this.chartdata.numPersonsInChat > 4;
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
        scales: {
          x: {
            stacked,
            grid: {
              display: false,
            },
          },
          y: {
            stacked,
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
            title: {
              display: true,
              text: this.$t("messages"),
            },
          },
        },
      };
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
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.chart-container :deep(canvas) {
  margin: 0 auto !important;
  max-width: 100% !important;
  max-height: 100% !important;
}
</style>
