<template>
  <div>
    <div class="text-h4 font-weight-bold text-lg-h4 text-xl-h2">
      {{ $t(titelH1) }}
    </div>
    <br />
    <div class="text-h6 text-lg-body-1 text-xl-h5">
      <span v-html="$t(titelH2)" />
    </div>
    <br />
    <div class="py-1 px-3 text-lg-body-2 text-xl-h5 alert grey-highlight">
      <v-icon color="black" style="vertical-align: sub"> mdi-security</v-icon>
      <span v-html="$t('infoSec')" />
    </div>
    <br />
    <div class="py-1 px-3 text-lg-body-2 text-xl-h5 alert grey-highlight">
      <img
        alt="github logo"
        height="22"
        src="~/assets/img/github/GitHub-Mark-32px.png"
        style="vertical-align: sub"
      />
      <span v-html="$t('infoPriv')" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    titelH1: {
      default: function() {
        return "analyzeInSeconds";
      },
      type: String
    },
    titelH2: {
      default: function() {
        return "revealInsights";
      },
      type: String
    }
  }
};
</script>

<style>
.alert {
  color: black;
  border-radius: 10px;
  width: 100%;
}

.grey-highlight {
  background: rgba(0, 0, 0, 0.1);
}
</style>
