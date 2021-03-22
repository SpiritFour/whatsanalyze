<template>
  <v-container class="mt-md-16 mt-5">
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
        <v-row v-if="$vuetify.breakpoint.mdAndUp">
          <div class="text-body-2">
            "Das Ergebnis verspricht eine erstaunliche Datensammlung mitsamt
            einiger Fun-Facts und spannender Visualisierungen."
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
        <v-row v-if="$vuetify.breakpoint.mdAndUp">
          <div class="text-body-2">
            "...könnt ihr unter anderem herausfinden, zu welcher Uhrzeit ihr am
            häufigsten WhatsApp-Nachrichten schreibt."
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
        <v-row v-if="$vuetify.breakpoint.mdAndUp">
          <div class="text-body-2">
            "Die Analyse der Chats findet nur in eurem Browser statt, sodass nur
            ihr die Daten, die ihr aus WhatsApp exportiert, sehen könnt."
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
