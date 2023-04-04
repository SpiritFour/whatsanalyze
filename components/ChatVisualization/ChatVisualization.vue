<template>
  <v-col class="my-4 mb-16">
    <div class="text-h3 text-md-h1 font-weight-bold">{{ $t("fullChat") }}</div>
    <v-divider class="py-5" />
    <!-- this could be refactored into a component -->
    <v-row id="payButton" justify="center">
      <PdfDownload
        :attachments="attachments"
        :chat="chat"
        :currency="currency"
        :ego="ego"
        :price="price"
      />
    </v-row>
    <v-row>
      <Chat :attachments="attachments" :chat="chat" @setEgo="setEgo" />
    </v-row>

    <v-row justify="center">
      <PdfDownload
        :attachments="attachments"
        :chat="chat"
        :currency="currency"
        :ego="ego"
        :price="price"
      />
    </v-row>
  </v-col>
</template>

<script>
import PdfDownload from "~/components/ChatVisualization/PdfDownloadPopup";

export default {
  name: "ChatVisualization",
  components: { PdfDownload },
  props: ["chat", "attachments", "results"],
  data() {
    return {
      // its possible that the first person did not write any message at all
      ego: this.chat.messagesPerPerson[0]?.name,
      price: 4.99,
      currency: "EUR",
    };
  },
  methods: {
    setEgo(ego) {
      this.ego = ego;
    },
  },
};
</script>
