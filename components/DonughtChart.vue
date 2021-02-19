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
    chartdata: function () {
      this.renderChart(this.chartdata.getShareOfSpeech(), this.options);
    },
  },
  mounted() {
    this.renderChart(this.chartdata.getShareOfSpeech(), this.options);
  },
};
</script>
