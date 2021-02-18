<script>
import { Bar } from "vue-chartjs";
import { Chat } from "~/functions/transformChatData";

export default {
  extends: Bar,
  props: {
    chartdata: new Chat(),
    // eslint-disable-next-line vue/require-prop-type-constructor
    hourly: true,
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
    chartdata: function () {
      if (this.hourly) {
        this.renderChart(this.chartdata.getHourlyData(), this.options);
      } else {
        this.renderChart(this.chartdata.getDailyData(), this.options);
      }
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
