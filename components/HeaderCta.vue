<template>
  <div>
    <div class="text-h4 font-weight-bold text-lg-h1">
      {{ titelH1 }}
    </div>
    <div class="text-h6 text-lg-h4">
      {{ titelH2 }}
    </div>
    <br />
    <div
      style="
        background: rgba(217, 60, 60, 0.7);
        color: black;
        border-radius: 10px;
        width: fit-content;
      "
      class="py-1 px-3 text-lg-h6"
    >
      <v-icon color="black" style="vertical-align: sub"> mdi-security </v-icon>
      <strong>No</strong> chat <strong>data</strong> is sent to a server it runs
      only <strong>locally</strong> in your browser.
    </div>
  </div>
</template>

<script>
export default {
  props: {
    titelH1: { default: "Analyze your WhatsApp Chat in Seconds", type: String },
    titelH2: {
      default:
        "Reveal insights & get statistics, while all data stays on your device.",
      type: String,
    },
  },
};
</script>
