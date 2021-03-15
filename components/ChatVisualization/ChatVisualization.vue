<template>
  <v-col class="my-4 mb-16">
    <div class="text-h1 font-weight-bold">Your Full Chat</div>
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
import { render } from "~/functions/pdf";
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
    detectCurrency() {
      fetch("https://extreme-ip-lookup.com/json/")
        .then((res) => res.json())
        .then((response) => {
          if (response !== undefined && response !== "undefined")
            this.currency = getCurrencyAbbreviation(response.country);
        })
        .catch(() => {});
    },
    download() {
      this.$gtag.event("download-pdf", {
        event_category: "download",
        event_label: "download-pdf",
        value: "10",
      });
      this.isLoading = true;
      render(this.chat, this.attachments, this.ego, false).then(
        () => (this.isLoading = false)
      );
    },
    onCreateOrder(data, actions) {
      console.log("order created", data, actions);
    },
    onApprove() {
      this.download();
    },
    onError() {},
    downloadSample() {
      this.$gtag.event("download-sample-pdf", {
        event_category: "home",
        event_label: "download-sample-pdf",
        value: "5",
      });
      this.isLoading = true;
      // download sample
      render(this.chat, this.attachments, this.ego, true).then(
        () => (this.isLoading = false)
      );
    },
  },
  mounted() {
    this.detectCurrency();
  },
};
</script>
