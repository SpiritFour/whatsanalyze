<template>
  <div class="cta pa-2 pa-md-5 my-md-2 overflow-hidden">
    <div class="text-h4 text-md-h3 font-weight-bold pb-4">
      {{ $t("downloadPDF") }}
    </div>

    <v-row>
      <v-img
        :src="require('@/assets/pdf-example.jpg')"
        class="ma-auto my-4"
        max-width="100%"
      />
    </v-row>

    <v-row v-show="isLoading" class="ma-3">
      <div class="text-body-1 pa-2">
        {{ $t("waitingForPDF") }}
      </div>
      <div v-show="!progress">
        <v-progress-circular indeterminate style="height: 1em" color="blue">
        </v-progress-circular>
        Loading your images, videos and documents
      </div>

      <v-progress-linear
        v-show="progress"
        class=""
        color="blue"
        :value="progress"
      ></v-progress-linear>
    </v-row>

    <v-dialog v-model="showDownloadPopup" width="550">
      <template #activator="{ on, attrs }">
        <v-row class="pa-0 ma-0" justify="center">
          <v-col class="pa-0 ma-0">
            <v-btn elevation="10" @click="downloadSample">
              <v-icon class="mr-1">mdi-download</v-icon>
              <span><b>free</b> preview PDF</span>
            </v-btn>
            <v-col class="mt-2">
              <v-row align="center" justify="center">
                <b style="color: green">{{ 0 + " " + currency }}</b>
              </v-row>
            </v-col>
          </v-col>
          <v-col class="pa-0 ma-0">
            <v-btn
              class="white--text btn-color"
              dark
              elevation="10"
              style="max-width: 100%"
              v-bind="attrs"
              @click="gtagEvent('full_pdf_pressed', GTAG_PAYMENT)"
              v-on="on"
            >
              <v-icon class="mr-1">mdi-download</v-icon>
              <span><b>full</b> chat PDF</span>
            </v-btn>
            <v-col class="mt-2">
              <v-row align="center" justify="center">
                <b style="color: green">{{ price + " " + currency }}</b>
                <span
                  class="px-1 ml-2"
                  style="color: white; background: red; border-radius: 5px"
                >
                  -66%</span
                >
              </v-row>
              <v-row align="center" justify="center">
                <s style="color: grey">{{ 15 + " " + currency }}</s>
              </v-row>
            </v-col>
          </v-col>
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
          class="mb-2"
          color="blue"
          indeterminate
        ></v-progress-linear>
        <v-row align="center" class="pt-6 pr-10" cols="12" justify="center">
          <ChatVisualizationPayment
            :amount="price"
            :currency="currency"
            @onApprove="onApprove"
            @onCreateOrder="onCreateOrder"
            @onError="onError"
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
import { GTAG_PAYMENT, GTAG_PDF, gtagEvent } from "~/functions/gtagValues";
import PDFWorker from "worker-loader!~/assets/js/pdf.worker.js";
import { objectToDictionary } from "~/functions/utils";
import { saveAs } from "file-saver";
import { loadImage } from "~/functions/utils";

export default {
  name: "PdfDownload",
  props: ["currency", "price", "chat", "attachments", "ego"],
  data() {
    return {
      showDownloadPopup: false,
      isLoading: false,
      GTAG_PAYMENT,
      GTAG_PDF,
      progress: 0,
    };
  },
  methods: {
    downloadFull() {
      gtagEvent("full_download", GTAG_PDF, 3);
      this.download(true);
    },
    onCreateOrder() {
      gtagEvent("created", GTAG_PAYMENT, 0);
    },
    onApprove() {
      gtagEvent("approved", GTAG_PAYMENT, 10);
      this.downloadFull();
      this.showDownloadPopup = false;
    },
    onError() {},
    async download(full = false) {
      if (process.browser) {
        this.isLoading = true;
        this.progress = 0;
        // the graphs need to be converted to an image beforehand, as the web worker has no access to document
        const chatTimeline = await loadImage("#chat-timeline");
        const messagesPerTimeOfDay = await loadImage(
          "#messages-per-time-of-day"
        );
        const messagesPerPerson = await loadImage("#messages-per-person");
        const radarMonth = await loadImage("#radar-month");
        const radarDay = await loadImage("#radar-day");

        const worker = new PDFWorker();
        worker.addEventListener("message", this.workerResponseHandler);

        const chat = objectToDictionary(this.chat); // remove functions
        chat.funFacts = await this.chat.getFunFacts(); // set funfacts beforehand instead of using function call

        worker.postMessage({
          // pass all data to service worker
          chat: chat,
          attachments: this.attachments,
          ego: this.ego,
          isSample: full,
          chatTimeline,
          messagesPerTimeOfDay,
          messagesPerPerson,
          radarMonth,
          radarDay,
        });
      }
    },
    downloadSample() {
      gtagEvent("sample_download", GTAG_PDF, 2);
      this.download(!this.$route.query.free);
    },
    workerResponseHandler: function (event) {
      const data = event.data;
      if (data.type === "pdf") {
        // service workers can not save files
        const blob = new Blob([data.data], { type: "application/pdf" });
        saveAs(blob, "WhatsAnalyze - " + this.ego);
        this.isLoading = false;
      }
      if (data.type === "progress") {
        this.progress = data.data;
      }
    },
    gtagEvent,
  },
};
</script>
