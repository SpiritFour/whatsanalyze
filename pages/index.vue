<template>
  <v-main>
    <Content :page="page" />
    <FileHandler />
    <BarChart />
    <LineChart />
    <RadarChart />
    <DonughtChart />
  </v-main>
</template>

<script>
export default {
  async asyncData({ $content }) {
    const page = await $content("home").fetch();
    console.log(page);
    return {
      page,
    };
  },

  data() {
    return {
      isStripeLoaded: false,
    };
  },
  methods: {},
};
</script>

<style></style>
