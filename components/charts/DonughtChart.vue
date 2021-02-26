<script>
import { Doughnut } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Doughnut,
  props: {
    chartdata: new Chat(),
    options: {
      type: Object,
      default: function () {
        return {
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            position: "bottom",
          },
        };
      },
    },
  },
  watch: {
    chartdata: {
      handler() {
        this.updateGraph();
      },
      deep: true,
    },
  },
  methods: {
    updateGraph() {
      this.chartdata
        .getShareOfSpeech()
        .then((x) => this.renderChart(x, this.options));
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
