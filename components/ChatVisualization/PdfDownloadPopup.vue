<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="wa-scope rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-6 text-center shadow-card md:p-8"
  >
    <h2
      class="m-0 text-2xl font-bold text-wa-ink md:text-3xl"
      v-html="$t('downloadPDF')"
    ></h2>

    <img
      src="/pdf-example.jpg"
      alt=""
      class="mx-auto mt-6 w-full max-w-[560px] rounded-token border border-solid border-[rgba(29,29,31,0.08)]"
      loading="lazy"
    />

    <!-- Building the PDF takes a while on a long chat, so say what is
         happening: first while the media is still being read, then with a
         real percentage once the pages start rendering. -->
    <div v-show="isLoading" class="mx-auto mt-6 max-w-[420px]">
      <p class="m-0 text-sm text-wa-ink-muted" v-html="$t('waitingForPDF')"></p>

      <p
        v-show="!progress"
        class="m-0 mt-2 flex items-center justify-center gap-2 text-sm text-wa-ink-faint"
      >
        <span
          class="block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[rgba(29,29,31,0.15)] border-t-wa-accent"
        ></span>
        <span v-html="$t('loadingMedia')"></span>
      </p>

      <div
        v-show="progress"
        class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(29,29,31,0.08)]"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full rounded-full bg-wa-accent transition-all"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Download dialog -->
    <div class="mt-6 flex justify-center">
      <v-dialog v-model="showDownloadPopup" width="550">
        <template #activator="{ props: activatorProps }">
          <UiButton
            v-if="hasFullAccess"
            size="lg"
            v-bind="activatorProps"
            @click="downloadFull"
          >
            <span v-html="$t('downloadNow')"></span>
          </UiButton>
          <UiButton
            v-else
            size="lg"
            class="mt-6"
            v-bind="activatorProps"
            @click="gtagEvent('full_pdf_pressed', GTAG_PAYMENT)"
          >
            <IconDownload />
            <span v-html="$t('downloadFullChatPDF')"></span>
          </UiButton>
        </template>

        <v-card class="wa-scope overflow-hidden rounded-token-lg">
          <!-- Popup title + subtitle -->
          <div class="bg-wa-accent px-6 py-5 text-white">
            <p class="m-0 text-xl font-bold" v-html="$t('popupTitle')"></p>
            <p
              class="m-0 mt-1 text-sm opacity-90"
              v-html="$t('popupSubtitle')"
            ></p>
          </div>

          <div class="px-6 py-5 text-center">
            <p
              class="m-0 text-sm font-semibold text-wa-ink"
              v-html="$t('popupInfo')"
            ></p>

            <div v-if="isLoading" class="loading my-4" />

            <!-- Download button if subscribed -->
            <UiButton
              v-if="hasFullAccess"
              size="lg"
              class="mt-5"
              @click="downloadFull"
            >
              <span v-html="$t('downloadNow')"></span>
            </UiButton>

            <!-- Payment section if the full PDF is not unlocked yet -->
            <template v-else>
              <UiButton
                size="lg"
                class="mt-5"
                :loading="isOneTimeLoading"
                @click="payOneTimeStripe"
              >
                <IconCard v-if="!isOneTimeLoading" />
                <span>{{ $t("chooseOneTime") }} ({{ oneTimePrice }})</span>
              </UiButton>

              <div
                class="mt-5 rounded-token bg-[rgba(33,166,141,0.08)] p-4 text-sm text-wa-ink-muted"
              >
                <span v-html="$t('subscriptionHint')"></span>
                <UiButton
                  to="/subscribe"
                  variant="secondary"
                  size="sm"
                  class="mt-3"
                  block
                >
                  <span v-html="$t('openSubscriptionPage')"></span>
                </UiButton>
              </div>
            </template>
          </div>

          <!-- Close button -->
          <div
            class="flex justify-end border-0 border-t border-solid border-[rgba(29,29,31,0.08)] px-4 py-3"
          >
            <UiButton
              variant="danger"
              size="sm"
              @click="showDownloadPopup = false"
            >
              <span v-html="$t('closeButton')"></span>
            </UiButton>
          </div>
        </v-card>
      </v-dialog>
    </div>

    <!-- Pricing Section -->
    <div v-if="!hasFullAccess" class="mt-12">
      <h3 class="m-0 text-xl font-bold text-wa-ink md:text-2xl">
        {{ $t("pricingTitle") }}
      </h3>
      <p class="m-0 mt-2 text-sm text-wa-ink-muted">
        {{ $t("pricingSubtitle") }}
      </p>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <!-- Free -->
        <div class="pricing-card">
          <div>
            <p class="pricing-card__title">{{ $t("freeTierTitle") }}</p>
            <p class="pricing-card__text">{{ $t("freeTierDescription") }}</p>
          </div>
          <div>
            <UiButton variant="secondary" block @click="handleFreePdfClick">
              <IconDownload />
              <span v-html="$t('downloadFreePreviewPDF')"></span>
            </UiButton>
            <p class="pricing-card__price">{{ freePrice }}</p>
          </div>
        </div>

        <!-- One-time -->
        <div class="pricing-card pricing-card--featured">
          <div>
            <p class="pricing-card__title">{{ $t("oneTimeTitle") }}</p>
            <p class="pricing-card__text">
              {{ $t("oneTimeDescription", { price: oneTimePrice }) }}
            </p>
          </div>
          <div>
            <UiButton
              block
              @click="
                showDownloadPopup = true;
                gtagEvent('full_pdf_pressed', GTAG_PAYMENT);
              "
            >
              <IconDownload />
              <span v-html="$t('downloadFullChatPDF')"></span>
            </UiButton>
            <p class="pricing-card__price">
              {{ oneTimePrice }}
              <span class="pricing-card__badge">-{{ discountPercent }}%</span>
              <s class="pricing-card__was">{{ oneTimeListPrice }}</s>
            </p>
          </div>
        </div>

        <!-- Subscription -->
        <div class="pricing-card">
          <div>
            <p class="pricing-card__title">{{ $t("subscriptionTitle") }}</p>
            <p class="pricing-card__text">
              {{
                $t("subscriptionDescription", {
                  price: introPrice,
                  monthlyPrice: subscriptionPrice,
                })
              }}
            </p>
          </div>
          <div>
            <SubscribeBtn />
            <p class="pricing-card__price">
              {{ $t("subscriptionPriceFirstMonth", { price: introPrice }) }}
            </p>
            <p class="pricing-card__was pricing-card__was--block">
              {{ $t("then") }}
              {{ $t("subscriptionPriceAfter", { price: subscriptionPrice }) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { saveAs } from "file-saver";
import { markRaw, toRaw } from "vue";
import { GTAG_PAYMENT, GTAG_PDF, gtagEvent } from "~/utils/gtagValues";
import { analyticsChat, analyticsEcommerce } from "~/composables/useAnalytics";
import { fetchOneTimeCheckoutUrl } from "~/utils/subscription";
  INTRO_PRICE,
  ONE_TIME_DISCOUNT_PERCENT,
  ONE_TIME_LIST_PRICE,
  ONE_TIME_PRICE,
  SUBSCRIPTION_PRICE,
  formatPrice,
} from "~/utils/pricing";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { scrollToSettled } from "~/utils/scroll";
import PDFWorker from "~/assets/js/pdf.worker.js?worker";
import { loadImage, objectToDictionary } from "~/utils/utils";

export default {
  props: {
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
      discountPercent: ONE_TIME_DISCOUNT_PERCENT,
      progress: 0,
      pdfWorker: null,
    };
  },
  computed: {
    /**
     * Every amount in this table goes through one formatter: it used to quote
     * "7,99 Euro", "7.99 EUR" and "15 EUR" within a single card.
     */
    freePrice() {
      return formatPrice(0, this.$i18n.locale);
    },
    oneTimePrice() {
      return formatPrice(ONE_TIME_PRICE, this.$i18n.locale);
    },
    oneTimeListPrice() {
      return formatPrice(ONE_TIME_LIST_PRICE, this.$i18n.locale);
    },
    introPrice() {
      return formatPrice(INTRO_PRICE, this.$i18n.locale);
    },
    subscriptionPrice() {
      return formatPrice(SUBSCRIPTION_PRICE, this.$i18n.locale);
    },
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
      analyticsChat.download("pdf_sample");
    },
    downloadFull() {
      gtagEvent("full_download", GTAG_PDF, 3);
      analyticsChat.download("pdf_full");
      this.download(false);
      this.showDownloadPopup = false;
    },
    async payOneTimeStripe() {
      if (this.isOneTimeLoading) return;
      gtagEvent("created", GTAG_PAYMENT, 0);
      analyticsEcommerce.beginCheckout({
        checkoutType: "one_time",
        source: "pdf_download_popup",
        value: 2.99,
      });
      this.isOneTimeLoading = true;
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
        saveAs(blob, `WhatsAnalyze - ${String(this.ego).trim()}.pdf`);
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

<style lang="scss" scoped>
.pricing-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid $wa-border;
  border-radius: $wa-radius-lg;
  background: $wa-surface-white;
}

/* The one we actually sell. */
.pricing-card--featured {
  border-color: $wa-accent;
  box-shadow: 0 10px 30px rgba(33, 166, 141, 0.12);
}

.pricing-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: $wa-ink;
  /* "Subscription" is one word and wider than the card on its own. */
  overflow-wrap: anywhere;
}

.pricing-card__text {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: $wa-ink-muted;
}

.pricing-card__price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.9rem 0 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: $wa-ink;
}

.pricing-card__badge {
  padding: 0.1rem 0.35rem;
  border-radius: 5px;
  background: $c-red-dark;
  color: #ffffff;
  font-size: 0.7rem;
}

.pricing-card__was {
  font-size: 0.85rem;
  font-weight: 500;
  color: $wa-ink-faint;
}

.pricing-card__was--block {
  display: block;
  margin: 0.25rem 0 0;
}
</style>
