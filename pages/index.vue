<template>
  <v-main>
    <div class="text-h1">Whatsanalyse</div>
    <Content :page="page" />

    <FileHandler @new_messages="messages = $event" />
    <BarChart />
    <LineChart :chartdata="chat2frequencies(messages)" />
    <RadarChart />
    <DonughtChart />
  </v-main>
</template>

<script>
import { chat2frequencies } from "~/functions/transformChatData";

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
      messages: [],
    };
  },
  methods: { chat2frequencies },
};
</script>

<style></style>
