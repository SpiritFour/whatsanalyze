<template>
  <v-content>
    <FileHandler />
    <BarChart />
    <LineChart />
    <RadarChart />
    <DonughtChart />
  </v-content>
</template>

<script>
import DataFrame from "dataframe-js";
import DonughtChart from "~/components/DonughtChart.vue";
export default {
  components: { DonughtChart },
  data() {
    return {
      isStripeLoaded: false
    };
  },
  methods: {
    test() {
      const df = new DataFrame(
        [
          { c1: 1, c2: 6 },
          { c4: 1, c3: 2 }
        ],
        ["c1", "c2", "c3", "c4"]
      );
      console.log(df);
    }
  },
  head() {
    return {
      title: "Payment Page - My awesome project",
      script: [
        {
          hid: "stripe",
          src: "https://gmousse.github.io/dataframe-js/dist/dataframe.js",
          defer: true,
          // Changed after script load
          callback: () => {
            this.isStripeLoaded = true;
            this.test();
          }
        }
      ]
    };
  }
};
</script>

<style></style>
