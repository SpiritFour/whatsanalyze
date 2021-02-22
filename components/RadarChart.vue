<script>
import { Radar } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Radar,
  props: {
    dataGrouping: {
      type: String,
      validator: function (value) {
        // The value must match one of these strings
        return ["hourly", "daily", "weekly"].indexOf(value) !== -1;
      },
    },
    chartdata: new Chat(),
    options: {
      type: Object,
      default: function () {
        return {
          responsive: true,
          maintainAspectRatio: false,
          scale: {
            angleLines: {
              // display: false,
            },
            ticks: {
              beginAtZero: true,
              precision: 0,
            },
          },
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: ["Messages per time unit"],
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
        this.renderChart(this.chartdata.getHourlyData(0.1), this.options);
      } else if (this.dataGrouping === "daily") {
        this.renderChart(this.chartdata.getDailyData(0.1), this.options);
      } else {
        this.renderChart(this.chartdata.getWeeklyData(0.1), this.options);
      }
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
