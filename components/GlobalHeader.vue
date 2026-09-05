<template>
  <div class="nav pl-xs-8 pl-0 py-0 py-md-0 additional-height">
    <v-container class="pl-md-16">
      <v-card color="#21a68d" flat>
        <v-card-actions
          class="d-flex align-center flex-nowrap py-2 px-1 px-sm-3"
        >
          <nuxt-link :to="$localePath('/')" class="brand-link">
            <img
              alt="WhatsAnalyze Logo"
              class="brand-logo"
              src="~/assets/whatsanalyze-logo-black.png"
            />
            <span class="brand-name">WhatsAnalyze</span>
          </nuxt-link>

          <v-spacer></v-spacer>

          <nuxt-link :to="$localePath('/tools')" class="header-tools-link">
            <v-icon size="16" class="mr-1" color="#000000"
              >mdi-toolbox-outline</v-icon
            >
            <span>Tools</span>
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

.brand-link {
  display: inline-flex !important;
  align-items: center !important;
  text-decoration: none !important;
  white-space: nowrap !important;
  flex-shrink: 0;
}

.brand-logo {
  height: 34px;
  width: auto;
  margin-right: 10px;
  flex-shrink: 0;
  display: block;

  @media (max-width: 600px) {
    height: 26px;
    margin-right: 6px;
  }
}

.brand-name {
  color: #000000 !important;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  line-height: 1;

  @media (max-width: 600px) {
    font-size: 1.2rem;
  }
}

.header-tools-link,
.header-tools-link:link,
.header-tools-link:visited {
  display: inline-flex !important;
  align-items: center !important;
  color: #000000 !important;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.12);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 6px 14px;
  border-radius: 10px;
  text-decoration: none !important;
  white-space: nowrap;
  transition: all 0.2s ease;
  margin-right: 8px;
  flex-shrink: 0;

  &:hover {
    background: #ffffff;
    color: #000000 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 600px) {
    font-size: 0.8rem;
    padding: 4px 10px;
    margin-right: 6px;
  }
}

.nav {
  width: 100%;
  background: $c-blue-accent;
}
</style>
