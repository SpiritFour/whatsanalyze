<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="cta pa-2 pa-md-5 my-md-2 overflow-hidden">
    <!-- Title -->
    <div
      class="text-h4 text-md-h3 font-weight-bold pb-4"
      v-html="$t('downloadPDF')"
    ></div>

    <v-row>
      <v-img
        :src="require('@/assets/pdf-example.jpg')"
        class="ma-auto my-4"
        max-width="100%"
      />
    </v-row>

    <!-- Loading section -->
    <v-row v-show="isLoading" class="ma-3">
      <div class="text-body-1 pa-2" v-html="$t('waitingForPDF')"></div>

      <div v-show="!progress">
        <v-progress-circular
          indeterminate
          style="height: 1em"
          color="blue"
        />
        <span v-html="$t('loadingMedia')"></span>
      </div>

      <v-progress-linear
        v-show="progress"
        color="blue"
        :value="progress"
      />
    </v-row>

    <!-- Download dialog -->
    <v-dialog v-model="showDownloadPopup" width="550">
      <template #activator="{ on, attrs }">
        <v-row class="pa-0 ma-0" justify="center">

          <!-- Free Preview PDF button -->
          <v-col
            class="pa-0 ma-0"
            v-if="!isValidSubscription"
          >
            <v-btn elevation="10" @click="downloadSample">
              <v-icon class="mr-1">mdi-download</v-icon>
              <span v-html="$t('downloadFreePreviewPDF')"></span>
            </v-btn>
            <v-col class="mt-2">
              <v-row align="center" justify="center">
                <b style="color: green">{{ 0 + ' ' + currency }}</b>
              </v-row>
            </v-col>
          </v-col>

          <!-- Full PDF button -->
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
              <span v-html="$t('downloadFullChatPDF')"></span>
            </v-btn>

            <v-col
              class="mt-2"
              v-if="!isValidSubscription"
            >
              <v-row align="center" justify="center">
                <b style="color: green">{{ price + ' ' + currency }}</b>
                <span
                  class="px-1 ml-2"
                  style="color: white; background: red; border-radius: 5px"
                >-66%</span>
              </v-row>
              <v-row align="center" justify="center">
                <s style="color: grey">{{ 15 + ' ' + currency }}</s>
              </v-row>
            </v-col>
          </v-col>

        </v-row>
      </template>

      <v-card>
        <!-- Popup title + subtitle -->
        <v-card-title class="headline cyan" style="word-break: normal">
          <div class="text-h4 font-weight-bold" v-html="$t('popupTitle')"></div>
          <span v-html="$t('popupSubtitle')"></span>
        </v-card-title>

        <!-- Popup text -->
        <v-card-text class="pt-3 text-body-1 font-weight-bold">
          <span v-html="$t('popupInfo')"></span>
        </v-card-text>

        <div v-if="isLoading" class="loading mb-2" />

        <!-- Download or Payment -->
        <v-row
          align="center"
          class="py-6 ma-0"
          cols="12"
          justify="center"
        >
          <!-- Download button if subscribed -->
          <v-btn v-if="isValidSubscription" @click="downloadFull">
            <span v-html="$t('downloadNow')"></span>
          </v-btn>

          <!-- Payment section if not subscribed -->
          <div v-else>
            <ChatVisualizationPayment
              :amount="price"
              :currency="currency"
              @onApprove="onApprove"
              @onCreateOrder="onCreateOrder"
              @onError="onError"
            />
            <v-alert dense type="info" prominent>
              <span v-html="$t('subscriptionHint')"></span>
              <v-btn to="/subscribe">
                <span v-html="$t('openSubscriptionPage')"></span>
              </v-btn>
            </v-alert>
          </div>
        </v-row>

        <v-divider></v-divider>

        <!-- Close button -->
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="showDownloadPopup = false">
            <span v-html="$t('closeButton')"></span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<!-- eslint-enable vue/no-v-html -->
<script>
import { GTAG_PAYMENT, GTAG_PDF, gtagEvent } from "~/utils/gtagValues";
import PDFWorker from "worker-loader!~/assets/js/pdf.worker.js";
import { loadImage, objectToDictionary } from "~/utils/utils";
import { saveAs } from "file-saver";
import SubscriptionChecker from "~/components/SubscriptionChecker.vue";
import { Chat } from "~/utils/transformChatData";

export default {
  name: "PdfDownload",
  components: { SubscriptionChecker },
  props: {
    currency: { type: String, required: true },
    price: { type: Number, required: true },
    chat: { type: Object, required: true },
    attachments: { type: Array, default: () => [] },
    ego: { type: String, required: true },
    isValidSubscription: { type: Boolean, default: false }
  },
  data() {
    return {
      showDownloadPopup: false,
      isLoading: false,
      GTAG_PAYMENT,
      GTAG_PDF,
      progress: 0
    };
  },
  methods: {
    downloadFull() {
      gtagEvent("full_download", GTAG_PDF, 3);
      this.download(false);
      this.showDownloadPopup = false;
    },
    onCreateOrder() {
      gtagEvent("created", GTAG_PAYMENT, 0);
    },
    onApprove() {
      gtagEvent("approved", GTAG_PAYMENT, 10);
      this.downloadFull();
    },
    onError() {
    },
    async download(isSample = false) {
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
        chat.totalCalls = Chat.getTotalCallMinutes(this.chat.chatObject);

        worker.postMessage({
          // pass all data to service worker
          chat: chat,
          attachments: this.attachments,
          ego: this.ego,
          isSample,
          chatTimeline,
          messagesPerTimeOfDay,
          messagesPerPerson,
          radarMonth,
          radarDay
        });
      }
    },
    downloadSample() {
      gtagEvent("sample_download", GTAG_PDF, 2);
      this.download(true);
    },
    workerResponseHandler: function(event) {
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
    gtagEvent
  }
};
</script>
