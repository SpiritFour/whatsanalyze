<template>
  <v-container class="cta pt-7 my-5 text-center">
    <div class="text-h2 font-weight-bold mb-7">{{ $t(title) }}</div>

    <v-row v-if="showImage">
      <v-img
        :lazy-src="require('@/assets/my-chat.jpg')"
        :src="require('@/assets/my-chat.jpg')"
        class="ma-auto mt-4 mb-8"
        max-width="250"
      />
    </v-row>
    <span class="text-body-1"> {{ $t(text) }}</span>
    <br />
    <v-btn
      :to="to ? to : null"
      class="mt-5 text-h6 btn-color"
      elevation="10"
      style="color: #ffffff"
      @click="clickHandler"
    >
      {{ $t(buttonTxt) }}
    </v-btn>
  </v-container>
</template>

<script>
import { GTAG_INTERACTION, gtagEvent } from "~/functions/gtagValues";

export default {
  props: {
    showImage: { default: false, type: Boolean },
    to: { default: "", type: String },
    buttonTxt: {
      default: function() {
        return "analyzeYourChat";
      },
      type: String
    },
    text: {
      default: function() {
        return "analyzeYourChatLong";
      },
      type: String
    },
    title: {
      default: function () {
        return "analyzeYourChatTitle";
      },
      type: String
    }
  },
  data() {
    return {
      GTAG_INTERACTION
    };
  },
  methods: {
    clickHandler() {
      if (!this.to) {
        gtagEvent("jump_to_filehandler_cta", GTAG_INTERACTION, 0);
        this.$vuetify.goTo(".filehandler", { duration: 300, offset: 300 });
      }
    },
    gtagEvent
  }
};
</script>