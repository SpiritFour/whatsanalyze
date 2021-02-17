<script>
import { Radar } from "vue-chartjs";

export default {
  extends: Radar,
  props: {
    chartdata: {
      type: Object,
      default: function() {
        return {
          labels: ["January", "February", "March", "April", "May", "June"],
          datasets: [
            {
              label: "Person 1",
              backgroundColor: "rgba(255, 99, 132, 0.1)",
              borderColor: "rgba(255, 99, 132, 1)",

              data: [60, 10, 60, 10, 60, 10]
            },
            {
              label: "Person 2",
              backgroundColor: "rgba(75, 192, 192, 0.1)",
              borderColor: "rgba(75, 192, 192, 1)",

              data: [40, 70, 40, 70, 40, 70]
            }
          ]
        };
      }
    },
    options: {
      type: Object,
      default: function() {
        return {
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            position: "bottom"
          },
          scale: {
            ticks: {
              min: 0
            }
          }
        };
      }
    }
  },

  mounted() {
    this.renderChart(this.chartdata, this.options);
  }
};
</script>
