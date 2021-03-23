<template>
  <v-container class="mt-md-1 my-3">
    <v-row
      ><div class="ml-5 mb-1 text-h5 font-weight-bold">Known from:</div></v-row
    >
    <v-row justify="center">
      <v-col v-for="site in trustedSites" :key="site.description">
        <v-row justify="center">
          <a :href="site.description">
            <v-avatar size="70"><img :src="site.image" /></v-avatar>
          </a>
        </v-row>
        <v-row class="pt-2" v-if="$vuetify.breakpoint.mdAndUp">
          <div class="text-body-2">
            {{ site.description }}
          </div>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "trust-logos",
  data() {
    return {
      trustedSites: [
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/trust-logos/chip_logo.png"),
          href:
            "https://www.chip.de/downloads/webapp-WhatsAnalyze-WhatsApp-analysieren_183369368.html",
          description: '"Fun-Facts und spannende Visualisierungen"',
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/trust-logos/giga_logo.png"),
          href:
            "https://www.giga.de/news/ueberraschende-einblicke-whatsapp-chats-kostenlos-analysieren/",
          description: '"Die Analyse findet nur in eurem Browser statt"',
        },
        {
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/trust-logos/netzwelt.png"),
          href:
            "https://www.netzwelt.de/news/187295-whatsapp-webseite-analysiert-chats.html",
          description: '"Zu welcher Uhrzeit ihr am häufigsten schreibt"',
        },
      ],
    };
  },
};
</script>

<style scoped></style>
