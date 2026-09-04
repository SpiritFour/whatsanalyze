<template>
  <v-container class="cta pt-7 my-5 text-center">
    <div class="text-h2 font-weight-bold mb-7">{{ $t(title) }}</div>

    <v-row v-if="showImage">
      <v-img
        :lazy-src="chatImage"
        :src="chatImage"
        class="ma-auto mt-4 mb-8"
        max-width="250"
      />
    </v-row>
    <span class="text-body-1"> {{ $t(text) }}</span>
    <br />
    <v-btn
      :to="to ? to : null"
      class="mt-5 text-h6 btn-color cta-btn"
      elevation="10"
      size="x-large"
      style="color: #ffffff"
      @click="clickHandler"
    >
      {{ $t(buttonTxt) }}
    </v-btn>
  </v-container>
</template>

<script>
import { GTAG_INTERACTION, gtagEvent } from "~/utils/gtagValues";
import chatImage from "~/assets/my-chat.jpg";
import { scrollTo } from "~/utils/scroll";

export default {
  props: {
    showImage: { default: false, type: Boolean },
    to: { default: "", type: String },
    buttonTxt: {
      default: function () {
        return "analyzeYourChat";
      },
      type: String,
    },
    text: {
      default: function () {
        return "analyzeYourChatLong";
      },
      type: String,
    },
    title: {
      default: function () {
        return "analyzeYourChatTitle";
      },
      type: String,
    },
  },
  data() {
    return {
      chatImage,
      GTAG_INTERACTION,
    };
  },
  methods: {
    clickHandler() {
      if (!this.to) {
        gtagEvent("jump_to_filehandler_cta", GTAG_INTERACTION, 0);
        scrollTo(".filehandler", { offset: 300 });
      }
    },
    gtagEvent,
  },
};
</script>

<style scoped>
.cta-btn {
  min-height: 52px;
  height: auto !important;
  padding: 12px 32px !important;
  white-space: normal;
  text-align: center;
  line-height: 1.4 !important;
}
</style>
