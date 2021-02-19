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
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
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
        if (this.hourly) {
          this.renderChart(this.chartdata.getHourlyData(), this.options);
        } else {
          this.renderChart(this.chartdata.getDailyData(), this.options);
        }
      },
      deep: true,
    },
  },

  mounted() {
    if (this.hourly) {
      this.renderChart(this.chartdata.getHourlyData(), this.options);
    } else {
      this.renderChart(this.chartdata.getDailyData(), this.options);
    }
  },
};
</script>
