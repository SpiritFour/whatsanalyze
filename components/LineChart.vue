<script>
import { Line } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Line,
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
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                },
              },
            ],
          },
        };
      },
    },
  },
  watch: {
    chartdata: function () {
      this.renderChart(this.chartdata.getLineGraphData(), this.options);
    },
  },
  mounted() {
    this.renderChart(this.chartdata.getLineGraphData(), this.options);
  },
};
</script>
