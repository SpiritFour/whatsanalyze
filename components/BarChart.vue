<script>
import { Bar } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Bar,
  props: {
    chartdata: new Chat(),
    hourly: {
      type: Boolean,
      default: true,
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
      if (this.hourly) {
        this.renderChart(this.chartdata.getHourlyData(), this.options);
      } else {
        this.renderChart(this.chartdata.getDailyData(), this.options);
      }
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
