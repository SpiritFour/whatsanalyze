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
                  labelString: "number of messages",
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
        this.renderChart(this.chartdata.getHourlyData(), this.options);
      } else if (this.dataGrouping === "daily") {
        this.renderChart(this.chartdata.getDailyData(), this.options);
      } else {
        this.renderChart(this.chartdata.getWeeklyData(), this.options);
      }
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
