<template>
  <div class="cta pa-10 my-md-4">
    <div class="text-h4 text-md-h3 font-weight-bold pb-4">
      Download your Chat as PDF
    </div>
    <v-progress-linear
      v-show="isLoading"
      indeterminate
      color="blue"
      class="mb-2"
    ></v-progress-linear>
    <div class="text-body-1 my-2">
      Get your <b>full</b> WhatsApp chat for
      <b>{{ price + " " + currency }}</b> as a PDF instantly.
    </div>

    <v-dialog v-model="showDownloadPopup" width="550">
      <template v-slot:activator="{ on, attrs }">
        <v-row justify="center" class="mt-3">
          <v-btn class="mr-3" elevation="10" @click="downloadSample">
            <v-icon class="mr-1">mdi-download</v-icon>
            <span><b>free</b> preview PDF</span>
          </v-btn>
          <v-btn
            dark
            v-bind="attrs"
            v-on="on"
            color="#07bc4c"
            style="color: white; max-width: 100%"
            elevation="10"
            @click="
              $gtag.event('download-chat-popup-clicked', {
                event_category: 'download',
                event_label: 'popup-clicked',
                value: '1',
              })
            "
          >
            <v-icon class="mr-1">mdi-download</v-icon>
            <span><b>full</b> chat PDF</span>
          </v-btn>
        </v-row>
      </template>
      <v-card>
        <v-card-title class="headline cyan" style="word-break: normal">
          <div class="text-h4 font-weight-bold">Nice !!</div>
          <span>You are just a step away from your PDF!</span>
        </v-card-title>
        <v-card-text class="pt-3 text-body-1 font-weight-bold">
          Supporting us keeps the 💻 running 🎉
        </v-card-text>
        <v-progress-linear
          v-show="isLoading"
          indeterminate
          color="blue"
          class="mb-2"
        ></v-progress-linear>
        <v-row cols="12" justify="center" align="center" class="pt-6 pr-10">
          <ChatVisualizationPayment
            @onCreateOrder="onCreateOrder"
            @onApprove="onApprove"
            @onError="onError"
            :currency="currency"
            :amount="price"
          />
        </v-row>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="showDownloadPopup = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { render } from "~/functions/pdf";

export default {
  name: "PdfDownload",
  props: ["currency", "price", "chat", "attachments", "ego"],
  data() {
    return {
      showDownloadPopup: false,
      isLoading: false,
    };
  },
  methods: {
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
      this.showDownloadPopup = false;
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
};
</script>
