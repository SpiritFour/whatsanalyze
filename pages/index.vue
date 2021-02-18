<template>
  <v-main>
    <div style="text-align: center" class="testimonial-container">
      <h2 style="text-align: center">
        People who analyse their chats - get first hand data insights
      </h2>

      <div style="overflow: hidden">
        <div class="testimonial">
          <v-icon large color="black"> mdi-format-quote-close </v-icon>
          <p>Jennifer says</p>
          <p>
            Visualizing my friends chat revealed a lot about our relationship. I
            always though that I was the one sending more messages. Really nice
            to see all those fun facts about our history. Keep it going and add
            more beautiful visuals
          </p>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
        </div>
        <div class="testimonial">
          <v-icon large color="black"> mdi-format-quote-close </v-icon>
          <p>Lara says</p>
          <p>
            Amazing to see a whole whatsapp history at a glance. I have chats
            going back multiple years seeing how the relationship is mirrored in
            the chat is amazing. I love that my files are not uploaded and that
            it runs directly in my browser
          </p>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
          <v-icon large color="#ffd782"> mdi-star </v-icon>
        </div>
      </div>
    </div>

    <div class="cta-bottom">
      <h1 style="text-align: center">Start now</h1>
      <span>
        Analyse your chat, reveal unknown facts and surprise your friends with
        insights into your communication.</span
      >
      <br />

      <v-btn
        to="#drop"
        @click="
          $gtag.event('click-cta', {
            event_category: 'home',
            event_label: 'lead',
            value: '1',
          })
        "
        color="#07bc4c"
        style="color: white"
        class="my-5"
      >
        Analyse my chat</v-btn
      >
    </div>

    <FileHandler @new_messages="messages = $event" id="drop" />
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

<style lang="scss">
@media (min-width: 760px) {
  .testimonial {
    min-width: 300px;
    width: 50%;
    float: left;
    padding: 3em;
  }
}
@media (max-width: 759px) {
  .testimonial {
    width: 100%;
    padding: 3em;
  }
}

.cta-bottom {
  text-align: center;
  background: $c-white;
  padding: 1em;
  margin-top: 2em;
  margin-bottom: 2em;
}

.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
