<script>
import { Bar } from "vue-chartjs";

export default {
  extends: Bar,
  mounted() {
    this.renderChart([10, 20, 30, 40, 50, 60, 70], {      arPercentage: 0.5,
      barThickness: 6,
    });
  },
};
</script>

<style></style>
