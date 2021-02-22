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
                scaleLabel: {
                  display: true,
                  labelString: "number of messages",
                },
                ticks: {
                  beginAtZero: true,
                },
              },
            ],
            xAxes: [
              {
                type: "time",
                time: {
                  unit: this.chartdata.linegraphXAxisUnit,
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
      var lineGraphData = this.chartdata.getLineGraphData();
      // eslint-disable-next-line vue/no-mutating-props
      this.options.scales.xAxes[0].time.unit = lineGraphData[1];
      this.renderChart(lineGraphData[0], this.options);
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
