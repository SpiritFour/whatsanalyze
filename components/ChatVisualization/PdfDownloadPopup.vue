<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="cta pa-2 pa-md-5 my-md-2 overflow-hidden">
    <!-- Title -->
    <div
      class="text-h4 text-md-h3 font-weight-bold pb-4"
      v-html="$t('downloadPDF')"
    ></div>

    <v-row>
      <v-img src="/pdf-example.jpg" class="ma-auto my-4" max-width="100%" />
    </v-row>
    <!-- Loading section -->
    <v-row v-show="isLoading" class="ma-3">
      <div class="text-body-1 pa-2" v-html="$t('waitingForPDF')"></div>

      <div v-show="!progress">
        <v-progress-circular indeterminate style="height: 1em" color="blue" />
        <span v-html="$t('loadingMedia')"></span>
      </div>

      <v-progress-linear v-show="progress" color="blue" :value="progress" />
    </v-row>

    <!-- Download dialog -->
    <v-row justify="center">
      <v-dialog v-model="showDownloadPopup" width="550">
        <template #activator="{ props: activatorProps }">
          <v-btn
            v-if="hasFullAccess"
            color="success"
            v-bind="activatorProps"
            @click="downloadFull"
          >
            <span v-html="$t('downloadNow')"></span>
          </v-btn>
          <v-btn
            v-else
            color="success"
            class="mt-10"
            v-bind="activatorProps"
            @click="gtagEvent('full_pdf_pressed', GTAG_PAYMENT)"
          >
            <v-icon class="mr-1">mdi-download</v-icon>
            <span v-html="$t('downloadFullChatPDF')"></span>
          </v-btn>
        </template>

        <v-card>
          <!-- Popup title + subtitle -->
          <v-card-title class="bg-cyan" style="word-break: normal">
            <div
              class="text-h4 font-weight-bold"
              v-html="$t('popupTitle')"
            ></div>
            <span v-html="$t('popupSubtitle')"></span>
          </v-card-title>

          <!-- Popup text -->
          <v-card-text class="pt-3 text-body-1 font-weight-bold">
            <span v-html="$t('popupInfo')"></span>
          </v-card-text>

          <div v-if="isLoading" class="loading mb-2" />

          <!-- Download or Payment -->
          <v-row align="center" class="py-6 ma-0" cols="12" justify="center">
            <!-- Download button if subscribed -->
            <v-btn v-if="hasFullAccess" @click="downloadFull">
              <span v-html="$t('downloadNow')"></span>
            </v-btn>

            <!-- Payment section if the full PDF is not unlocked yet -->
            <div v-else class="text-center">
              <v-btn
                color="success"
                size="large"
                class="mb-3"
                :loading="isOneTimeLoading"
                @click="payOneTimeStripe"
              >
                <v-icon class="mr-1">mdi-credit-card</v-icon>
                <span
                  >{{ $t("chooseOneTime") }} ({{ price }} {{ currency }})</span
                >
              </v-btn>
              <v-alert density="compact" type="info" prominent>
                <span v-html="$t('subscriptionHint')"></span>
                <v-btn to="/subscribe" class="ml-2" variant="tonal">
                  <span v-html="$t('openSubscriptionPage')"></span>
                </v-btn>
              </v-alert>
            </div>
          </v-row>

          <v-divider></v-divider>

          <!-- Close button -->
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="red-darken-1"
              variant="text"
              @click="showDownloadPopup = false"
            >
              <span v-html="$t('closeButton')"></span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <!-- Pricing Section -->
    <div v-if="!hasFullAccess" class="pricing-section mt-10">
      <div class="text-h2 font-weight-bold pb-5">
        {{ $t("pricingTitle") }}
      </div>
      <div class="text-subtitle-1">{{ $t("pricingSubtitle") }}</div>
      <v-row justify="center" align="center" class="py-5">
        <!-- Free Tier -->
        <v-col cols="12" sm="4">
          <div class="pricing-card text-center py-5 px-4">
            <div class="text-h4 text-lg-h3 font-weight-bold title">
              {{ $t("freeTierTitle") }}
            </div>
            <div class="text-body-1 py-3 subtitle">
              {{ $t("freeTierDescription") }}
            </div>
            <v-btn
              color="primary"
              variant="outlined"
              class="mt-3 mb-4"
              @click="handleFreePdfClick"
            >
              <v-icon class="mr-1">mdi-download</v-icon>
              <span v-html="$t('downloadFreePreviewPDF')"></span>
            </v-btn>
            <div class="price-description">
              <b style="color: green">{{ 0 + " " + currency }}</b>
            </div>
          </div>
        </v-col>

        <!-- One-Time Payment -->
        <v-col cols="12" sm="4">
          <div class="pricing-card text-center py-5 px-4">
            <div class="text-h4 text-lg-h3 font-weight-bold title">
              {{ $t("oneTimeTitle") }}
            </div>
            <div class="text-body-1 py-3 subtitle">
              {{ $t("oneTimeDescription") }}
            </div>
            <v-btn
              color="success"
              class="mt-3 mb-4"
              @click="
                showDownloadPopup = true;
                gtagEvent('full_pdf_pressed', GTAG_PAYMENT);
              "
            >
              <v-icon class="mr-1">mdi-download</v-icon>
              <span v-html="$t('downloadFullChatPDF')"></span>
            </v-btn>
            <div class="price-description">
              <v-row align="center" justify="center">
                <b style="color: green">{{ price + " " + currency }}</b>
                <span
                  class="px-1 ml-2"
                  style="color: white; background: red; border-radius: 5px"
                >
                  -50%
                </span>
              </v-row>
              <v-row align="center" justify="center">
                <s style="color: grey">{{ 15 + " " + currency }}</s>
              </v-row>
            </div>
          </div>
        </v-col>

        <!-- Monthly Subscription -->
        <v-col cols="12" sm="4">
          <div class="pricing-card text-center py-5 px-4">
            <div class="text-h4 text-lg-h3 font-weight-bold title">
              {{ $t("subscriptionTitle") }}
            </div>
            <div class="text-body-1 py-3 subtitle">
              {{ $t("subscriptionDescription") }}
            </div>
            <SubscribeBtn> </SubscribeBtn>
            <div class="price-description">
              <v-row align="center" justify="center">
                <b style="color: green">{{
                  $t("subscriptionPriceFirstMonth")
                }}</b>
              </v-row>
              <v-row align="center" justify="center">
                <span style="color: grey"
                  >{{ $t("then") }} {{ $t("subscriptionPriceAfter") }}</span
                >
              </v-row>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import { saveAs } from "file-saver";
import { markRaw, toRaw } from "vue";
import { GTAG_PAYMENT, GTAG_PDF, gtagEvent } from "~/utils/gtagValues";
import { fetchOneTimeCheckoutUrl } from "~/utils/subscription";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { scrollToSettled } from "~/utils/scroll";
import PDFWorker from "~/assets/js/pdf.worker.js?worker";
import { loadImage, objectToDictionary } from "~/utils/utils";

export default {
  props: {
    currency: { type: String, required: true },
    price: { type: Number, required: true },
    chat: { type: Object, required: true },
    attachments: { type: Array, default: () => [] },
    ego: { type: String, required: true },
    isValidSubscription: { type: Boolean, default: false },
  },
  setup() {
    return { oneTimePurchase: useOneTimePurchase() };
  },
  data() {
    return {
      showDownloadPopup: false,
      isLoading: false,
      isOneTimeLoading: false,
      GTAG_PAYMENT,
      GTAG_PDF,
      progress: 0,
      pdfWorker: null,
    };
  },
  computed: {
    /** Identifies the chat on screen, to tie a single payment to it. */
    currentChatFingerprint() {
      // toRaw: reading every message through the reactive proxy would make
      // this depend on each one of them, and the chat's lazy getters mutate
      // themselves — the fingerprint would be recomputed over the whole chat
      // again and again while the PDF is being built.
      return chatFingerprint(toRaw(this.chat));
    },
    /** Unlocked by a subscription or by a single payment for this chat. */
    hasFullAccess() {
      return (
        this.isValidSubscription ||
        unlocksChat(this.oneTimePurchase, this.currentChatFingerprint)
      );
    },
  },
  watch: {
    oneTimePurchase() {
      this.downloadPurchasedPdf();
    },
    // The buyer was told to upload the paid chat again — deliver it the moment
    // they do, without making them hunt for the button.
    currentChatFingerprint() {
      this.downloadPurchasedPdf();
    },
  },
  mounted() {
    this.downloadPurchasedPdf();
  },
  beforeUnmount() {
    this.closePdfWorker();
  },
  methods: {
    /**
     * Start the download the buyer just paid for. The flag is cleared first so
     * that later navigations within the session do not download it again.
     */
    downloadPurchasedPdf() {
      const purchase = useOneTimePurchase();
      if (!purchase.value?.pendingDownload) return;
      // Only deliver into the chat that was paid for. If a different one is on
      // screen the purchase stays pending until that chat is uploaded again.
      if (!unlocksChat(purchase.value, this.currentChatFingerprint)) return;

      purchase.value = { ...purchase.value, pendingDownload: false };
      // Stripe drops the buyer back at the top of a long page. Bring them down
      // to the download section, where the PDF they paid for is being built.
      this.$nextTick(() => scrollToSettled("#payButton", { offset: 100 }));
      this.$nextTick(() => this.downloadFull());
    },
    handleFreePdfClick() {
      this.downloadSample();
      this.gtagEvent("free_pdf_pressed", GTAG_PAYMENT);
    },
    downloadFull() {
      gtagEvent("full_download", GTAG_PDF, 3);
      this.download(false);
      this.showDownloadPopup = false;
    },
    async payOneTimeStripe() {
      if (this.isOneTimeLoading) return;
      gtagEvent("created", GTAG_PAYMENT, 0);
      this.isOneTimeLoading = true;
      try {
        rememberOneTimeCheckoutChat(this.currentChatFingerprint);
        const url = await fetchOneTimeCheckoutUrl({
          successUrl: `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}&payment_success=true`,
          cancelUrl: window.location.href,
        });
        if (!url) throw new Error("No checkout URL returned");
        window.location.assign(url);
      } catch (err) {
        console.error("Error creating one-time Stripe checkout:", err);
        alert("Failed to start checkout. Please try again.");
        this.isOneTimeLoading = false;
      }
    },
    async download(isSample = false) {
      if (!import.meta.client) return;

      this.isLoading = true;
      this.progress = 0;

      try {
        // the graphs need to be converted to an image beforehand, as the web worker has no access to document
        const chatTimeline = await loadImage("#chat-timeline");
        const messagesPerTimeOfDay = await loadImage(
          "#messages-per-time-of-day"
        );
        const messagesPerPerson = await loadImage("#messages-per-person");
        const radarMonth = await loadImage("#radar-month");
        const radarDay = await loadImage("#radar-day");
        this.pdfWorker = markRaw(new PDFWorker());
        // markRaw: never wrap the Worker in reactive proxies — proxied receivers break
        // native postMessage/addEventListener calls.
        this.pdfWorker.addEventListener("message", this.workerResponseHandler);
        this.pdfWorker.addEventListener("error", this.pdfErrorHandler);

        const chat = objectToDictionary(this.chat); // remove functions
        chat.funFacts = await this.chat.getFunFacts(); // set funfacts beforehand instead of using function call

        this.pdfWorker.postMessage({
          chat: chat,
          attachments: objectToDictionary(this.attachments),
          ego: this.ego,
          isSample,
          chatTimeline,
          messagesPerTimeOfDay,
          messagesPerPerson,
          radarMonth,
          radarDay,
        });
      } catch (error) {
        this.pdfErrorHandler(error);
      }
    },
    downloadSample() {
      gtagEvent("sample_download", GTAG_PDF, 2);
      const query = (this.$route && this.$route.query) || {};
      this.download(!("free" in query));
    },
    workerResponseHandler: function (event) {
      const data = event.data;
      if (data.type === "pdf") {
        // service workers can not save files
        const blob = new Blob([data.data], { type: "application/pdf" });
        saveAs(blob, "WhatsAnalyze - " + this.ego);
        this.isLoading = false;
        this.closePdfWorker();
      }
      if (data.type === "progress") {
        this.progress = data.data;
      }
    },
    pdfErrorHandler(error) {
      console.error("PDF generation failed", error);
      this.$sentry?.captureException(error);
      this.isLoading = false;
      this.progress = 0;
      this.closePdfWorker();
    },
    closePdfWorker() {
      if (!this.pdfWorker) return;

      this.pdfWorker.removeEventListener("message", this.workerResponseHandler);
      this.pdfWorker.removeEventListener("error", this.pdfErrorHandler);
      this.pdfWorker.terminate();
      this.pdfWorker = null;
    },
    gtagEvent,
  },
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
  min-height: 350px; /* Ensures equal card height */
}

/* Long labels used to run past the button and the card edge. */
.pricing-card :deep(.v-btn) {
  max-width: 100%;
  height: auto;
  min-height: 40px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.pricing-card :deep(.v-btn__content) {
  white-space: normal;
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
  /* "Subscription" is one word and wider than the card on its own. */
  overflow-wrap: anywhere;
}
</style>
