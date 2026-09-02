<template>
  <Radar v-if="graphData" :data="graphData" :options="chartOptions" />
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
          maintainAspectRatio: false,
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
