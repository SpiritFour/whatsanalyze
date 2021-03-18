<template>
  <div class="nav pl-xs-8 pl-0 py-0 py-md-8">
    <v-container>
      <nuxt-link to="/">
        <h1 style="color: black; font-size: 2em" class="pl-md-16">
          <img
            src="~/assets/whatsanalyze-logo-black.png"
            height="40px"
            alt="chat icon"
            style="vertical-align: sub"
            class="pr-3"
          />
          WhatsAnalyze
        </h1>
      </nuxt-link>
    </v-container>
  </div>
</template>
<script>
export default {
  name: "GlobalHeader",
};
</script>
<style lang="scss" scoped>
hr {
  margin: auto;
  margin-top: 1em;
  margin-bottom: 1em;
  border-top: none;
}

a:link {
  color: $c-white !important;
  text-decoration: none;
}

a:visited {
  color: $c-white !important;
}

a:hover {
  color: $c-blue-dark !important;
}

.small-h1 h1 {
  font-size: 2em !important;
}

.small-h2 h2 {
  font-size: 1.3em !important;
}

.nav {
  width: 100%;
  background: $c-blue-accent;
}

h1 {
  font-size: 3em;
}

h2 {
  font-size: 2em;
  font-weight: 400;
}
</style>
