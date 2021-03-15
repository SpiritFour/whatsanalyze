<template>
  <v-col class="my-4 mb-16">
    <div class="text-h3 text-md-h1 font-weight-bold">Your Full Chat</div>
    <v-divider class="py-5" />
    <!-- this could be refactored into a component -->
    <v-row justify="center" id="payButton">
      <PdfDownload
        :currency="currency"
        :price="price"
        :chat="chat"
        :attachments="attachments"
        :ego="ego"
      />
    </v-row>
    <v-row>
      <Chat :chat="chat" :attachments="attachments" @setEgo="setEgo" />
    </v-row>
    <v-row justify="center">
      <PdfDownload
        :currency="currency"
        :price="price"
        :chat="chat"
        :attachments="attachments"
        :ego="ego"
      />
    </v-row>
  </v-col>
</template>

<script>
import PdfDownload from "~/components/ChatVisualization/PdfDownloadPopup";
import { getCurrencyAbbreviation } from "country-currency-map";

export default {
  name: "ChatVisualization",
  components: { PdfDownload },
  props: ["chat", "attachments", "results"],
  data() {
    return {
      ego: this.chat.messagesPerPerson[0].name,
      price: 1.99,
      currency: "USD",
    };
  },
  methods: {
    setEgo(ego) {
      this.ego = ego;
    },
    // We lookup the IP to set the currency according to the user's location.
    detectCurrency() {
      fetch("https://extreme-ip-lookup.com/json/")
        .then((res) => res.json())
        .then((response) => {
          let userDependentCurrency = getCurrencyAbbreviation(response.country);
          if (userDependentCurrency !== undefined)
            this.currency = userDependentCurrency;
        })
        .catch(() => {});
    },
  },
  mounted() {
    this.detectCurrency();
  },
};
</script>
