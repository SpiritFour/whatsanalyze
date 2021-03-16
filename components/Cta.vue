<template>
  <v-container class="cta pt-7 my-5 text-center">
    <div class="text-h2 font-weight-bold mb-7">{{ title }}</div>
    <span class="text-body-1"> {{ text }}</span>
    <br />
    <v-btn
      :to="to ? to : null"
      @click="
        to ? null : gtagEvent('jump_to_filehandler_cta', GTAG_INTERACTION, 0);
        $vuetify.goTo('.filehandler', { duration: 300, offset: 100 });
      "
      color="#07bc4c"
      style="color: #ffffff"
      class="mt-5 text-h6"
      elevation="10"
    >
      {{ buttonTxt }}
    </v-btn>
  </v-container>
</template>

<script>
import { GTAG_INTERACTION, gtagEvent } from "~/functions/gtagValues";

export default {
  props: {
    to: { default: "", type: String },
    buttonTxt: { default: "Analyze your chat!", type: String },
    text: {
      default:
        "Analyze your chat, reveal unknown facts and surprise your friends with insights into your communication.",
      type: String,
    },
    title: {
      default: "Analyze your Chat",
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
