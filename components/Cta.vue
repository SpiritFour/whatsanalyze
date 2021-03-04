<template>
  <div class="cta-bottom my-md-8">
    <div class="text-h2 font-weight-bold">{{ title }}</div>
    <span class="text-body-1"> {{ text }}</span>
    <br />
    <v-btn
      to="/"
      @click="$vuetify.goTo('#fileHandler', { duration: 300, offset: 100 })"
      color="#07bc4c"
      style="color: #ffffff"
      class="mt-5 text-h6"
      elevation="10"
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

<style lang="scss">
.cta-bottom {
  text-align: center;
  background: $c-white;
  padding: 2em;
}
</style>
