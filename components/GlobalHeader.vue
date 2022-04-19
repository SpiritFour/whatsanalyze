<template>
  <div class="nav pl-xs-8 pl-0 py-0 py-md-0  additional-height">
    <v-container class="pl-md-16">
      <v-card color="#21a68d" flat tile>
        <v-card-actions>
          <nuxt-link to="/">
            <h1 style="color: black; font-size: 2em">
              <img
                alt="WhatsAnalyze Logo"
                class="pr-3"
                height="40px"
                src="~/assets/whatsanalyze-logo-black.png"
                style="vertical-align: sub"
              />
              WhatsAnalyze
            </h1>
          </nuxt-link>
          <v-spacer></v-spacer>
          <LanguageSwitcher />
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>
<script>
import LanguageSwitcher from "./LanguageSwitcher.vue";

export default {
  name: "GlobalHeader",
  components: { LanguageSwitcher }
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
