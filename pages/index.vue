<template>
  <v-main>
    <div class="text-h1">Whatsanalyse</div>
    <Content :page="page" />

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

<style></style>
