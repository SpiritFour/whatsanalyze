<template>
  <v-main>
    <Content :page="page" class="main-el" />

    <FileHandler @new_messages="messages = $event" />
    <BarChart :chartdata="funFacts(messages)" />
    <DonughtChart :chartdata="shareOfSpeech(messages)" />
    <RadarChart />
  </v-main>
</template>

<script>
import {
  chat2frequencies,
  funFacts,
  shareOfSpeech,
} from "~/functions/transformChatData";

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
  methods: { chat2frequencies, funFacts, shareOfSpeech },
};
</script>

<style>
.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
