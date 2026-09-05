<template>
  <div class="chart-container">
    <Doughnut v-if="graphData" :data="graphData" :options="chartOptions" />
  </div>
</template>

<script>
import { Doughnut } from "vue-chartjs";
import { Chat } from "~/utils/transformChatData";

export default {
  components: { Doughnut },
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
          maintainAspectRatio: true,
          aspectRatio: 1,
          plugins: {
            legend: {
              position: "bottom",
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
      this.graphData = await this.chartdata.getShareOfSpeech();
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
