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
                  labelString: this.$t("messages"),
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
    setStacked(startStackingAt = 4) {
      if (this.chartdata.numPersonsInChat > startStackingAt) {
        // eslint-disable-next-line vue/no-mutating-props
        this.options.scales.xAxes[0].stacked = true;
        // eslint-disable-next-line vue/no-mutating-props
        this.options.scales.yAxes[0].stacked = true;
      } else {
        // eslint-disable-next-line vue/no-mutating-props
        this.options.scales.xAxes[0].stacked = false;
        // eslint-disable-next-line vue/no-mutating-props
        this.options.scales.yAxes[0].stacked = false;
      }
    },
    updateGraph() {
      this.setStacked();
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
