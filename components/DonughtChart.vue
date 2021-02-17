<script>
import { Doughnut } from "vue-chartjs";

export default {
  extends: Doughnut,
  props: {
    chartdata: {
      type: Object,
      default: function() {
        return {
          labels: ["Moritz", "Paul"],
          datasets: [
            {
              label: "Donught 1",
              backgroundColor: [
                "rgba(75, 192, 192, 1)",
                "rgba(255, 99, 132, 1)"
              ],
              data: [60, 10]
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
