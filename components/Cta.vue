<template>
  <div class="cta-bottom">
    <div class="text-h2 py-10 font-weight-bold">{{ title }}</div>
    <span class="text-body-1"> {{ text }}</span>
    <br />
    <v-btn
      @click="$vuetify.goTo('#fileHandler', { duration: 300, offset: 100 })"
      color="#07bc4c"
      style="color: #ffffff"
      class="my-5 text-h6"
    >
      {{ buttonTxt }}
    </v-btn>
  </div>
</template>

<script>
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
};
</script>
