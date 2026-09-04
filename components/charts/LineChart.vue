<template>
  <Line v-if="graphData" :data="graphData" :options="chartOptions" />
</template>

<script>
import { Line } from "vue-chartjs";
import { Chat } from "~/utils/transformChatData";

export default {
  components: { Line },
  props: {
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
          elements: {
            line: {
              tension: 0,
            },
          },
          plugins: {
            legend: {
              display: false,
              position: "bottom",
            },
          },
          scales: {
            x: {
              type: "time",
              grid: {
                display: false,
                color: "#ffffff",
              },
            },
            y: {
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
    async updateGraph() {
      this.graphData = await this.chartdata.getLineGraphData();
    },
  },
};
</script>
