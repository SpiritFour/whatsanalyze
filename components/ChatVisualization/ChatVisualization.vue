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

export default {
  name: "ChatVisualization",
  components: { PdfDownload },
  props: ["chat", "attachments", "results"],
  data() {
    return {
      ego: this.chat.messagesPerPerson[0].name,
      price: 0.99,
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
