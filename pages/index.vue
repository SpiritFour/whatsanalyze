<template>
  <v-main>
    <Content :page="page" class="main-el" />
    <FileHandler class="main-el" />
    <BarChart class="main-el" />
    <LineChart class="main-el" />
    <RadarChart class="main-el" />
    <DonughtChart class="main-el" />
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

<style>
.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
