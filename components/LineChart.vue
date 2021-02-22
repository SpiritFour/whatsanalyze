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
          elements: {
            line: {
              tension: 0,
            },
          },
        };
      },
    },
  },
  watch: {
    chartdata: {
      handler() {
        this.renderChart(this.chartdata.getLineGraphData(), this.options);
      },
      deep: true,
    },
  },
  mounted() {
    this.renderChart(this.chartdata.getLineGraphData(), this.options);
  },
};
</script>
