<template>
  <v-main>
    <Content :page="page" class="main-el" />

    <FileHandler @new_messages="chat_ = new Chat($event)" />
    <DonughtChart :chartdata="chat_" />
    <BarChart :chartdata="chat_" :hour="true" />
    <RadarChart />
  </v-main>
</template>

<script>
import { Chat } from "~/functions/transformChatData";

export default {
  async asyncData({ $content }) {
    const page = await $content("home").fetch();
    return {
      page,
    };
  },

  data() {
    return {
      isStripeLoaded: false,
      chat_: new Chat(),
    };
  },
  methods: { Chat },
};
</script>

<style>
.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
