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
      if (this.chartdata) {
        let a = this.chartdata.getShareOfSpeech();
        console.log(a);
        this.renderChart(this.chartdata.getShareOfSpeech(), this.options);
      }
    },
  },
};
</script>
