<template>
  <v-container class="mt-md-1 my-3">
    <v-row
    >
      <div class="ml-5 mb-1 text-h5 font-weight-bold">
        {{ $t("known") }}
      </div>
    </v-row
    >
    <v-row justify="center">
      <v-col v-for="site in trustedSites" :key="site.name">
        <v-row justify="center">
          <a :href="site.href">
            <v-img :lazy-src="site.image" :src="site.image"
                   class="mb-0" style="border-radius: 35px; width: 70px; height: 70px" />
          </a>
        </v-row>
        <v-row v-if="$vuetify.breakpoint.mdAndUp" class="pt-8" justify="center">
          <figure>
            <blockquote>
              <div>{{ site.description }}</div>
            </blockquote>
            <figcaption class="text-right pr-3">—{{ site.name }}</figcaption>
          </figure>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "TrustLogos",
  data() {
    return {
      trustedSites: [
        {
          name: "Chip.de",
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/trust-logos/chip_logo.png"),
          href:
            "https://www.chip.de/downloads/webapp-WhatsAnalyze-WhatsApp-analysieren_183369368.html",
          description: "Fun-Facts und spannende Visualisierungen"
        },
        {
          name: "Giga.de",

          // eslint-disable-next-line no-undef
          image: require("~/assets/img/trust-logos/giga_logo.png"),
          href:
            "https://www.giga.de/news/ueberraschende-einblicke-whatsapp-chats-kostenlos-analysieren/",
          description: "Die Analyse findet nur in eurem Browser statt"
        },
        {
          name: "Netzwelt.de",
          // eslint-disable-next-line no-undef
          image: require("~/assets/img/trust-logos/netzwelt.jpeg"),
          href:
            "https://www.netzwelt.de/news/187295-whatsapp-webseite-analysiert-chats.html",
          description: "Zu welcher Uhrzeit ihr am häufigsten schreibt"
        }
      ]
    };
  }
};
</script>

<style scoped></style>
<style>
blockquote {
  margin: 0;
}

blockquote div {
  padding: 5px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

blockquote div::before {
  content: "\201C";
}

blockquote div::after {
  content: "\201D";
}
</style>
