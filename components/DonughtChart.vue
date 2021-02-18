<script>
import { Doughnut } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Doughnut,
  props: {
    chartdata: new Chat(),
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
