<template>
  <div class="cta">
    <div class="text-h2 font-weight-bold">{{ title }}</div>
    <span class="text-body-1"> {{ text }}</span>
    <br />
    <v-btn
      to="/"
      @click="
        gtagEvent('jump_to_filehandler_cta', GTAG_INTERACTION, 0);
        $vuetify.goTo('#fileHandler', { duration: 300, offset: 100 });
      "
      color="#07bc4c"
      style="color: #ffffff"
      class="mt-5 mb-2 text-h6"
      elevation="10"
    >
      {{ buttonTxt }}
    </v-btn>
  </div>
</template>

<script>
import { GTAG_INTERACTION, gtagEvent } from "~/functions/gtagValues";

export default {
  props: {
    buttonTxt: { default: "Analyze your chat now!", type: String },
    text: {
      default:
        "Analyze your chat, reveal unknown facts and surprise your friends with insights into your communication.",
      type: String,
    },
    title: {
      default: "Start now",
      type: String,
    },
  },
  data() {
    return {
      GTAG_INTERACTION,
    };
  },
  methods: {
    gtagEvent,
  },
};
</script>
