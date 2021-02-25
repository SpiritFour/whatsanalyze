<script>
import { Radar } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";
import { updateAlpha } from "~/functions/colors";

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
    updateGraph2() {
      if (this.dataGrouping === "hourly") {
        this.renderChart(this.chartdata.getHourlyData(0.1), this.options);
      } else if (this.dataGrouping === "daily") {
        this.renderChart(this.chartdata.getDailyData(0.1), this.options);
      } else {
        this.renderChart(this.chartdata.getWeeklyData(0.1), this.options);
      }
    },
    addOpacity(data) {
      data.datasets = data.datasets.map((p) => {
        p.backgroundColor = updateAlpha(p.backgroundColor, 0.1);
        return p;
      });
      return data;
    },

    updateGraph() {
      if (this.dataGrouping === "hourly") {
        this.chartdata
          .getHourlyData()
          .then(this.addOpacity)
          .then((x) => this.renderChart(x, this.options));
      } else if (this.dataGrouping === "daily") {
        this.chartdata
          .getDailyData()
          .then(this.addOpacity)
          .then((x) => this.renderChart(x, this.options));
      } else {
        this.chartdata
          .getWeeklyData()
          .then(this.addOpacity)
          .then((x) => this.renderChart(x, this.options));
      }
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
