<script>
import { Radar } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Radar,
  props: {
    hourly: {
      type: Boolean,
      default: true,
    },
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
          scale: {
            angleLines: {
              // display: false,
            },
            ticks: {
              beginAtZero: true,
              precision: 0,
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
    updateGraph() {
      if (this.hourly) {
        this.renderChart(this.chartdata.getHourlyData(), this.options);
      } else {
        this.renderChart(this.chartdata.getDailyData(), this.options);
      }
      // this.renderChart(this.chartdata.getHourlyData(), this.options);
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>
