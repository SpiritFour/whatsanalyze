<template>
  <Doughnut v-if="graphData" :data="graphData" :options="chartOptions" />
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
