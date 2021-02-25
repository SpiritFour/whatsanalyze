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
        this.renderChart(this.chartdata.getShareOfSpeech(), this.options);
      },
      deep: true,
    },
  },
  mounted() {
    this.renderChart(this.chartdata.getShareOfSpeech(), this.options);
  },
};
</script>
