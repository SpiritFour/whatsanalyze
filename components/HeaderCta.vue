<template>
  <div>
    <div class="text-h4 font-weight-bold text-lg-h2">
      {{ titelH1 }}
    </div>
    <br />
    <div class="text-h6 text-lg-h5">
      {{ titelH2 }}
    </div>
    <br />
    <div class="py-1 px-3 text-lg-h6 alert privacy">
      <v-icon color="black" style="vertical-align: sub"> mdi-security </v-icon>
      <b>No</b> chat <b>data</b> is sent to a server! All code runs
      <b>locally</b> in your browser.
    </div>
    <br />
    <div class="py-1 px-3 text-lg-h6 alert github">
      <img
        style="vertical-align: sub"
        alt="github logo"
        height="22"
        src="~/assets/img/github/GitHub-Mark-32px.png"
      />
      This project is <b>open-source</b> and all code is <b>public</b> on
      <b>github</b>.
      <a
        class="black--text"
        target="_blank"
        href="https://github.com/SpiritFour/whatsanalyze"
      >
        Check it yourself.
      </a>
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

<style>
.alert {
  color: black;
  border-radius: 10px;
  width: 100%;
}
.privacy {
  background: rgba(217, 60, 60, 0.7);
}
.github {
  background: rgba(2, 111, 140, 0.7);
}
</style>
