<template>
  <v-container class="mt-md-1 my-3">
    <v-row><div class="ml-5 text-h5 font-weight-bold">Known from:</div></v-row>
    <v-row justify="center">
      <v-col>
        <v-row justify="center">
          <a
            href="https://www.chip.de/downloads/webapp-WhatsAnalyze-WhatsApp-analysieren_183369368.html"
          >
            <v-avatar size="70"
              ><img src="~/assets/img/trust-logos/chip_logo.png"
            /></v-avatar>
          </a>
        </v-row>
        <v-row class="pt-1" v-if="$vuetify.breakpoint.mdAndUp">
          <div class="text-body-2">
            "Fun-Facts und spannende Visualisierungen."
          </div>
        </v-row>
      </v-col>
      <v-col>
        <v-row justify="center">
          <a
            href="https://www.netzwelt.de/news/187295-whatsapp-webseite-analysiert-chats.html"
          >
            <v-avatar size="70"
              ><img src="~/assets/img/trust-logos/netzwelt.png"
            /></v-avatar>
          </a>
        </v-row>
        <v-row class="pt-1" v-if="$vuetify.breakpoint.mdAndUp">
          <div class="text-body-2">
            "Zu welcher Uhrzeit ihr am häufigsten schreibt."
          </div>
        </v-row>
      </v-col>
      <v-col>
        <v-row justify="center">
          <a
            href="https://www.giga.de/news/ueberraschende-einblicke-whatsapp-chats-kostenlos-analysieren/"
          >
            <v-avatar size="70"
              ><img src="~/assets/img/trust-logos/giga_logo.png"
            /></v-avatar>
          </a>
        </v-row>
        <v-row class="pt-1" v-if="$vuetify.breakpoint.mdAndUp">
          <div class="text-body-2">
            "Die Analyse findet nur in eurem Browser statt"
          </div>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "trust-logos",
};
</script>

<style scoped></style>
