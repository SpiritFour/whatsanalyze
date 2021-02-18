<script>
import { Bar } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Bar,
  props: {
    chartdata: new Chat(),
  },
  watch: {
    chartdata: function () {
      this.renderChart(this.chartdata.getFunFacts(), this.options);
    },
  },
  mounted() {
    this.renderChart(this.chartdata.getFunFacts(), this.options);
  },
};
</script>
