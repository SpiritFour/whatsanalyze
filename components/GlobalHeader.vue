<template>
  <div class="nav pl-xs-8 pl-0 py-0 py-md-0 additional-height">
    <v-container class="pl-md-16">
      <v-card color="#21a68d" flat>
        <v-card-actions>
          <nuxt-link :to="$localePath('/')">
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
          <nuxt-link
            :to="$localePath('/tools')"
            class="header-nav-link text-body-1 font-weight-bold mr-3 mr-md-4 text-white text-decoration-none"
          >
            Tools
          </nuxt-link>
          <v-btn
            v-if="$vuetify.display.smAndUp"
            :to="$localePath('/')"
            color="black"
            variant="flat"
            class="header-cta-btn font-weight-bold text-white mr-2 mr-md-4 px-4"
            style="border-radius: 10px; text-transform: none !important"
          >
            <v-icon size="16" class="mr-1">mdi-message-text-outline</v-icon>
            {{ analyzeButtonText }}
          </v-btn>
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
  components: { LanguageSwitcher },
  computed: {
    analyzeButtonText() {
      const map = {
        de: "Chat analysieren",
        es: "Analizar chat",
        fr: "Analyser le chat",
        pt: "Analisar conversa",
        it: "Analizza chat",
      };
      return map[this.$i18n.locale] || "Analyze Chat";
    },
  },
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
