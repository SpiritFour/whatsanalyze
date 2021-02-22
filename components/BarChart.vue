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
                type: "time",
                time: {},
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
                  stepSize: 1,
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
        // eslint-disable-next-line vue/no-mutating-props
        this.options.scales.xAxes[0].type = "time";
        this.renderChart(this.chartdata.getHourlyData(), this.options);
      } else {
        // eslint-disable-next-line vue/no-mutating-props
        this.options.scales.xAxes[0].type = "category";
        this.renderChart(this.chartdata.getDailyData(), this.options);
      }
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
