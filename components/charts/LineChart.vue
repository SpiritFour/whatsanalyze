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
          pointHitRadius: 2,
          responsive: true,
          maintainAspectRatio: false,
          lineTension: 0,
          legend: {
            position: "bottom",
            display: false,
          },
          scales: {
            xAxes: [
              {
                type: "time",
                gridLines: {
                  display: false,
                  color: "#FFFFFF",
                },
              },
            ],
            yAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: this.$t("messages"),
                },
                ticks: {
                  precision: 0,
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
        this.updateGraph();
      },
      deep: true,
    },
  },
  methods: {
    updateGraph: function () {
      this.chartdata
        .getLineGraphData()
        .then((x) => this.renderChart(x, this.options));
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
