<template>
  <div class="chart-container">
    <Radar v-if="graphData" :data="graphData" :options="chartOptions" />
  </div>
</template>

<script>
import { Radar } from "vue-chartjs";
import { Chat } from "~/utils/transformChatData";
import { updateAlpha } from "~/utils/colors";

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
        this.options || {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
          scales: {
            r: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
          },
        }
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
    addOpacity(data) {
      return {
        ...data,
        datasets: data.datasets.map((dataset) => ({
          ...dataset,
          backgroundColor: updateAlpha(dataset.backgroundColor, 0.1),
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
      this.graphData = this.addOpacity(data);
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
