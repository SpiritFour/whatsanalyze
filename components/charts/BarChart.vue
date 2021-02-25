<script>
import { Bar } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Bar,
  props: {
    chartdata: new Chat(),
    dataGrouping: {
      type: String,
      validator: function (value) {
        // The value must match one of these strings
        return ["hourly", "daily", "weekly"].indexOf(value) !== -1;
      },
    },
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
            xAxes: [
              {
                gridLines: {
                  display: false,
                },
              },
            ],
            yAxes: [
              {
                scaleLabel: {
                  display: true,
                  labelString: "Messages",
                },
                ticks: {
                  beginAtZero: true,
                  precision: 0,
                },
              },
            ],
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
      if (this.dataGrouping === "hourly") {
        this.chartdata
          .getHourlyData()
          .then((x) => this.renderChart(x, this.options));
      } else if (this.dataGrouping === "daily") {
        this.chartdata
          .getDailyData()
          .then((x) => this.renderChart(x, this.options));
      } else {
        this.chartdata
          .getWeeklyData()
          .then((x) => this.renderChart(x, this.options));
      }
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
