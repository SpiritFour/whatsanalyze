<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="cta pa-2 pa-md-5 my-md-2 overflow-hidden">
    <!-- Title -->
    <div
      class="text-h4 text-md-h3 font-weight-bold pb-4"
      v-html="$t('downloadPDF')"
    ></div>

    <div>
      <v-img
        :src="require('@/assets/pdf-example.jpg')"
        class="ma-auto my-4"
        max-width="100%"
      />
    </div>

    <!-- Loading section -->
    <div v-show="isLoading" class="ma-3">
      <div class="text-body-1 pa-2" v-html="$t('waitingForPDF')"></div>

      <div v-show="!progress">
        <v-progress-circular
          color="blue"
          indeterminate
          style="height: 1em"
        />
        <span v-html="$t('loadingMedia')"></span>
      </div>

      <v-progress-linear
        v-show="progress"
        :value="progress"
        color="blue"
      />
    </div>

    <!-- Download dialog -->
    <v-dialog v-model="showDownloadPopup" width="550">
      <template #activator="{ on, attrs }">
        <!-- Pricing Section -->
        <div class="pricing-section mt-10">
          <div class="text-h2 font-weight-bold pb-5 ">{{ $t("pricingTitle") }}</div>
          <div class="text-subtitle-1 ">{{ $t("pricingSubtitle") }}</div>
          <div align="center" class="py-5" justify="center">
            <!-- Free Tier -->
            <div cols="12" sm="4">
              <div class="pricing-card text-center py-5 px-4">
                <div class="text-h3 font-weight-bold title">{{ $t("freeTierTitle") }}</div>
                <div class="text-body-1 py-3 subtitle">{{ $t("freeTierDescription") }}</div>
                <button
                  class="mt-3 mb-4"
                  color="primary"
                  outlined
                  @click="handleFreePdfClick"
                >
                  <v-icon class="mr-1">mdi-download</v-icon>
                  <span v-html="$t('downloadFreePreviewPDF')"></span>
                </button>
                <div class="price-description">
                  <b style="color: green">{{ 0 + " " + currency }}</b>
                </div>
              </div>
            </div>

            <!-- One-Time Payment -->
            <div cols="12" sm="4">
              <div class="pricing-card text-center py-5 px-4">
                <div class="text-h3 font-weight-bold title">{{ $t("oneTimeTitle") }}</div>
                <div class="text-body-1 py-3 subtitle">{{ $t("oneTimeDescription") }}</div>
                <button
                  class="mt-3 mb-4"
                  color="success"
                  v-bind="attrs"
                  @click="gtagEvent('full_pdf_pressed', GTAG_PAYMENT)"
                  v-on="on"
                >
                  <v-icon class="mr-1">mdi-download</v-icon>
                  <span v-html="$t('downloadFullChatPDF')"></span>
                </button>
                <div class="price-description">
                  <div align="center" justify="center">
                    <b style="color: green">{{ price + " " + currency }}</b>
                    <span
                      class="px-1 ml-2"
                      style="color: white; background: red; border-radius: 5px"
                    >
                      -50%
                    </span>
                  </div>
                  <div align="center" justify="center">
                    <s style="color: grey">{{ 15 + " " + currency }}</s>
                  </div>
                </div>
              </div>
            </div>

            <!-- Monthly Subscription -->
            <div cols="12" sm="4">
              <div class="pricing-card text-center py-5 px-4">
                <div class="text-h3 font-weight-bold title">{{ $t("subscriptionTitle") }}</div>
                <div class="text-body-1 py-3 subtitle">{{ $t("subscriptionDescription") }}</div>
                <button
                  class="mt-3 mb-4"
                  color="secondary"
                  elevation="10"
                  style="max-width: 100%"
                  v-bind="attrs"
                  @click="gtagEvent('subscription_pressed', GTAG_PAYMENT)"
                  v-on="on"
                >
                  {{ $t("chooseSubscription") }}
                </button>
                <div class="price-description">
                  <div align="center" justify="center">
                    <b style="color: green">{{ price - 3 + " " + currency }}</b>
                    <span
                      class="px-1 ml-2"
                      style="color: white; background: red; border-radius: 5px"
                    >
                      -80%
                    </span>
                  </div>
                  <div align="center" justify="center">
                    <s style="color: grey">{{ 24.95 + " " + currency }}</s>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div>
        <!-- Popup title + subtitle -->
        <div class="headline cyan" style="word-break: normal">
          <div class="text-h4 font-weight-bold" v-html="$t('popupTitle')"></div>
          <span v-html="$t('popupSubtitle')"></span>
        </div>

        <!-- Popup text -->
        <div class="pt-3 text-body-1 font-weight-bold">
          <span v-html="$t('popupInfo')"></span>
        </div>

        <div v-if="isLoading" class="loading mb-2" />

        <!-- Download or Payment -->
        <div
          align="center"
          class="py-6 ma-0"
          cols="12"
          justify="center"
        >
          <!-- Download button if subscribed -->
          <button v-if="isValidSubscription" @click="downloadFull">
            <span v-html="$t('downloadNow')"></span>
          </button>

          <!-- Payment section if not subscribed -->
          <div v-else>
            <ChatVisualizationPayment
              :amount="price"
              :currency="currency"
              @onApprove="onApprove"
              @onCreateOrder="onCreateOrder"
              @onError="onError"
            />
            <div dense prominent type="info">
              <span v-html="$t('subscriptionHint')"></span>
              <button to="/subscribe">
                <span v-html="$t('openSubscriptionPage')"></span>
              </button>
            </div>
          </div>
        </div>

        <v-divider></v-divider>

        <!-- Close button -->
        <div>
          <v-spacer></v-spacer>
          <button color="red darken-1" text @click="showDownloadPopup = false">
            <span v-html="$t('closeButton')"></span>
          </button>
        </div>
      </div>
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
    handleFreePdfClick() {
      this.downloadSample();
      this.gtagEvent("free_pdf_pressed", GTAG_PAYMENT);
    },
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

<style scoped>
.pricing-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%; /* Ensures equal height for all cards */
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-height: 400px; /* Adjust height as needed */
  min-height: 350px; /* Ensures equal card height */
}

.price-description {
  margin-top: 10px;
}

.subtitle {
  min-height: 100px; /* Ensures equal height for subtitles */
  display: flex;
  align-items: center;
  text-align: center;
}

.title {
  min-height: 100px; /* Ensures equal height for subtitles */
  display: flex;
  align-items: center;
  text-align: center;
}


</style>
