<template>
  <div>
    <div class="text-h4 font-weight-bold text-lg-h2">
      {{ $t(titelH1) }}
    </div>
    <br />
    <div class="text-h6 text-lg-h5">
      <span v-html="$t(titelH2)"> </span>
    </div>
    <br />
    <div class="py-1 px-3 text-lg-h6 alert privacy">
      <v-icon color="black" style="vertical-align: sub"> mdi-security </v-icon>
      <span v-html="$t('infoSec')" />
    </div>
    <br />
    <div class="py-1 px-3 text-lg-h6 alert github">
      <img
        style="vertical-align: sub"
        alt="github logo"
        height="22"
        src="~/assets/img/github/GitHub-Mark-32px.png"
      />
      <span v-html="$t('infoPriv')" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    titelH1: {
      default: function () {
        return "analyzeInSeconds";
      },
      type: String,
    },
    titelH2: {
      default: function () {
        return "revealInsights";
      },
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
