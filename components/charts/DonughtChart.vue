<template>
  <div class="chart-container">
    <Doughnut v-if="graphData" :data="graphData" :options="chartOptions" />
  </div>
</template>

<script>
import { Doughnut } from "vue-chartjs";
import { Chat } from "~/utils/transformChatData";
import { doughnutOptions, separateSegments } from "~/utils/chartTheme";

export default {
  components: { Doughnut },
  props: {
    chartdata: {
      type: Object,
      default: () => new Chat(),
    },
    compact: {
      type: Boolean,
      default: false,
    },
    /** Headline in the hole of the ring, e.g. the total message count. */
    centerLabel: {
      type: String,
      default: "",
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
    total() {
      const dataset = this.graphData?.datasets?.[0];
      if (!dataset) return 0;
      return dataset.data.reduce((sum, value) => sum + value, 0);
    },
    chartOptions() {
      if (this.options) return this.options;
      return doughnutOptions({
        compact: this.compact,
        centerText: this.centerLabel
          ? { value: this.total.toLocaleString(), label: this.centerLabel }
          : null,
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
      this.graphData = separateSegments(
        await this.chartdata.getShareOfSpeech()
      );
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
