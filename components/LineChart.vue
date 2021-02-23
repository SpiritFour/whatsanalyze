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
          pointHitRadius: 5,
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            position: "bottom",
          },
          scales: {
            xAxes: [
              {
                type: "time",
                time: {
                  unit: this.chartdata.linegraphXAxisUnit,
                },
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
                  labelString: "Messages",
                },
                ticks: {
                  precision: 0,
                  stepSize: 1,
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
