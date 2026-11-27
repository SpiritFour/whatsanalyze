<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="wa-scope rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-6 text-center shadow-card md:p-8"
  >
    <!-- Court: what the document contains on the left, the file it will be
         made from and the button on the right. -->
    <div
      :class="
        court && 'grid gap-8 text-left md:grid-cols-[1.15fr_1fr] md:items-start'
      "
    >
      <div>
        <h2
          class="m-0 text-2xl font-bold text-wa-ink md:text-3xl"
          v-html="$t('downloadPDF')"
        ></h2>

        <p
          v-if="court"
          class="m-0 mt-2 text-sm leading-relaxed text-wa-ink-muted"
        >
          {{ $t("pdfStyleCourtHint") }}
        </p>

        <!-- The styled chat PDF has its live preview right above, so the
             example of the chart-style PDF would only mislead there. -->
        <img
          v-if="!court && !chatView"
          src="/pdf-example.jpg"
          alt=""
          class="mx-auto mt-6 w-full max-w-[560px] rounded-token border border-solid border-[rgba(29,29,31,0.08)]"
          loading="lazy"
        />
        <!-- The example image shows the visual style, so the court style gets its
         own summary instead of a misleading preview. -->
        <ul
          v-else-if="court"
          class="m-0 mt-6 list-none space-y-3 p-0 text-sm text-wa-ink"
        >
          <li
            v-for="feature in courtFeatures"
            :key="feature"
            class="flex items-start gap-3"
          >
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(33,166,141,0.12)] text-xs font-bold text-wa-accent"
              aria-hidden="true"
              >✓</span
            >
            <span>{{ feature }}</span>
          </li>
        </ul>
      </div>

      <div>
        <!-- The file the transcript is made from, as its cover page will state it. -->
        <dl
          v-if="court"
          class="m-0 rounded-token border border-solid border-[rgba(29,29,31,0.1)] bg-[#fafafa] p-5 font-mono text-xs leading-relaxed text-wa-ink"
        >
          <dt class="sr-only">File</dt>
          <dd class="m-0 break-all font-sans text-base font-semibold">
            {{ source?.name || "WhatsApp chat" }}
          </dd>
          <dt class="sr-only">Contents</dt>
          <dd class="m-0 mt-1 text-wa-ink-muted">
            <template v-for="(part, index) in fileSummary" :key="part">
              <span v-if="index"> · </span>
              <span class="whitespace-nowrap">{{ part }}</span>
            </template>
          </dd>
          <template v-if="source?.sha256">
            <dt
              class="mt-4 font-sans text-[0.7rem] font-semibold uppercase tracking-wider text-wa-ink-faint"
            >
              SHA-256
            </dt>
            <dd v-for="line in sourceHashLines" :key="line" class="m-0">
              {{ line }}
            </dd>
          </template>
          <template v-if="media.total">
            <dt class="sr-only">Media</dt>
            <dd class="m-0 mt-4 font-sans text-sm text-wa-ink">
              {{ $t("pdfMediaIncluded", media) }}
            </dd>
          </template>
        </dl>
        <!-- Before anyone pays: a chat exported without media gives a PDF
             that can list its photos but not show them. -->
        <p
          v-if="court && media.found < media.total"
          class="m-0 mt-3 rounded-token bg-[rgba(217,119,6,0.08)] p-4 text-left text-sm leading-relaxed text-wa-ink"
        >
          {{ $t("pdfMediaMissing", { missing: media.total - media.found }) }}
        </p>

        <!-- Building the PDF takes a while on a long chat, so say what is
         happening: first while the media is still being read, then with a
         real percentage once the pages start rendering. -->
        <div v-show="isLoading" class="mx-auto mt-6 max-w-[420px]">
          <p
            class="m-0 text-sm text-wa-ink-muted"
            v-html="$t('waitingForPDF')"
          ></p>

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
                @click="trackFullPdfInterest('pdf_full_button')"
              >
                <IconDownload />
                <span v-html="$t('downloadFullChatPDF')"></span>
              </UiButton>
            </template>

            <v-card class="wa-scope relative rounded-token-lg">
              <button
                type="button"
                class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg text-wa-ink-faint hover:bg-[rgba(29,29,31,0.06)] hover:text-wa-ink"
                :aria-label="$t('closeButton')"
                @click="showDownloadPopup = false"
              >
                ✕
              </button>

              <div class="px-7 pb-7 pt-7 text-left">
                <h3
                  class="m-0 pr-8 text-xl font-bold text-wa-ink"
                  v-html="$t('popupTitle')"
                ></h3>
                <p
                  class="m-0 mt-1 text-sm text-wa-ink-muted"
                  v-html="$t('popupSubtitle')"
                ></p>

                <div v-if="isLoading" class="loading my-4" />

                <!-- Download button if subscribed -->
                <UiButton
                  v-if="hasFullAccess"
                  size="lg"
                  class="mt-6"
                  block
                  @click="downloadFull"
                >
                  <span v-html="$t('downloadNow')"></span>
                </UiButton>

                <!-- Payment section if the full PDF is not unlocked yet -->
                <template v-else>
                  <div
                    class="mt-6 flex items-baseline justify-between gap-4 border-0 border-y border-solid border-[rgba(29,29,31,0.08)] py-4"
                  >
                    <span class="text-sm font-semibold text-wa-ink">
                      {{ $t("oneTimeTitle") }}
                    </span>
                    <span class="whitespace-nowrap">
                      <s class="mr-2 text-sm text-wa-ink-faint">{{
                        oneTimeListPrice
                      }}</s>
                      <strong class="text-2xl text-wa-ink">{{
                        oneTimePrice
                      }}</strong>
                    </span>
                  </div>

                  <UiButton
                    size="lg"
                    class="mt-5"
                    block
                    :loading="isOneTimeLoading"
                    @click="payOneTimeStripe"
                  >
                    <IconCard v-if="!isOneTimeLoading" />
                    <span>{{ $t("chooseOneTime") }} ({{ oneTimePrice }})</span>
                  </UiButton>
                  <p
                    class="m-0 mt-3 text-center text-xs text-wa-ink-faint"
                    v-html="$t('popupInfo')"
                  ></p>

                  <div
                    class="mt-6 flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-[rgba(29,29,31,0.08)] pt-5 text-sm text-wa-ink-muted"
                  >
                    <span v-html="$t('subscriptionHint')"></span>
                    <UiButton :to="subscribeLink" variant="secondary" size="sm">
                      <span v-html="$t('openSubscriptionPage')"></span>
                    </UiButton>
                  </div>
                </template>
              </div>
            </v-card>
          </v-dialog>
        </div>
      </div>
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
                trackFullPdfInterest('pdf_full_card');
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
// file-saver is CJS: the named import resolves to undefined when Nitro
// renders this component on the server, which 500s the whole prerender.
import FileSaver from "file-saver";
import { toRaw } from "vue";
import {
  analyticsChat,
  analyticsEcommerce,
  ITEM_FULL_PDF,
} from "~/composables/useAnalytics";
import { fetchOneTimeCheckoutUrl } from "~/utils/subscription";
import {
  INTRO_PRICE,
  ONE_TIME_DISCOUNT_PERCENT,
  ONE_TIME_LIST_PRICE,
  ONE_TIME_PRICE,
  SUBSCRIPTION_PRICE,
  formatPrice,
} from "~/utils/pricing";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { scrollToSettled } from "~/utils/scroll";
import { renderChatPdf, renderChatViewPdf, renderCourtPdf } from "~/utils/pdf";
import { loadImage } from "~/utils/utils";
import {
  formatExactTimestamp,
  formatFileSize,
  formatHash,
} from "~/utils/courtEvidence";

export default {
  props: {
    chat: { type: Object, required: true },
    attachments: { type: Array, default: () => [] },
    ego: { type: String, required: true },
    // name, size and SHA-256 of the uploaded export, for the court PDF
    source: { type: Object, default: null },
    isValidSubscription: { type: Boolean, default: false },
    // the court evidence transcript instead of the visual story
    court: { type: Boolean, default: false },
    // the chat as on a phone, in a chosen style, instead of the visual story:
    // { options, title, labels(printed, total), locale, assets } — see
    // utils/pdf/chatPdf.ts
    chatView: { type: Object, default: null },
  },
  setup() {
    return {
      oneTimePurchase: useOneTimePurchase(),
      subscribeLink: useSubscribeLink(),
    };
  },
  data() {
    return {
      showDownloadPopup: false,
      isLoading: false,
      isOneTimeLoading: false,
      discountPercent: ONE_TIME_DISCOUNT_PERCENT,
      progress: 0,
      pdfFileType: null,
      // The export outlives a navigation away from the page; don't trigger a
      // download from a component that is already gone.
      isUnmounted: false,
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
    /** ["2.4 MB", "536 Messages", "2019-08-26 – 2021-02-16"] */
    fileSummary() {
      const messages = toRaw(this.chat).chatObject || [];
      const day = (message) => formatExactTimestamp(message?.date).slice(0, 10);
      return [
        this.source?.size && formatFileSize(this.source.size),
        `${messages.length.toLocaleString()} ${this.$t("messages")}`,
        messages.length && `${day(messages[0])} – ${day(messages.at(-1))}`,
      ].filter(Boolean);
    },
    /** Files the chat refers to, and how many of them the upload contains. */
    media() {
      const names = new Set(
        (toRaw(this.chat).chatObject || [])
          .map((message) => message.attachment?.fileName)
          .filter(Boolean),
      );
      const found = [...names].filter((name) =>
        this.attachments.some((file) => file.name.includes(name)),
      ).length;
      return { found, total: names.size };
    },
    sourceHashLines() {
      return formatHash(this.source?.sha256, 2);
    },
    courtFeatures() {
      return [1, 2, 3, 4].map((index) =>
        this.$t(`pdfStyleCourtFeature${index}`),
      );
    },
    /** What a full download is reported as. */
    fullFileType() {
      if (this.chatView) return "pdf_full_chat";
      return this.court ? "pdf_full_court" : "pdf_full";
    },
    fileName() {
      if (this.chatView) {
        // a file name, not a path: no slashes from a group's name
        const title = String(this.chatView.title).replace(/[\\/:*?"<>|]/g, "-");
        return `WhatsApp Chat - ${title.trim()}.pdf`;
      }
      return `${this.court ? "WhatsAnalyze Court Transcript" : "WhatsAnalyze"} - ${String(this.ego).trim()}.pdf`;
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
    this.isUnmounted = true;
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
    /** Someone reached for the paid PDF: the pricing card is what they see. */
    trackFullPdfInterest(source) {
      analyticsEcommerce.viewItem(source, ITEM_FULL_PDF);
    },
    handleFreePdfClick() {
      this.downloadSample();
      analyticsChat.download("pdf_sample");
    },
    downloadFull() {
      analyticsChat.download(this.fullFileType);
      this.download(false);
      this.showDownloadPopup = false;
    },
    async payOneTimeStripe() {
      if (this.isOneTimeLoading) return;
      analyticsEcommerce.beginCheckout({
        checkoutType: "one_time",
        source: "pdf_download_popup",
      });
      this.isOneTimeLoading = true;
      try {
        rememberOneTimeCheckoutChat(this.currentChatFingerprint);
        const url = await fetchOneTimeCheckoutUrl({
          // back to this page, where OneTimePurchaseReturn confirms it
          successUrl: `${window.location.origin}${this.$route.path}?session_id={CHECKOUT_SESSION_ID}&payment_success=true`,
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
      if (this.isLoading) return;

      this.isLoading = true;
      this.progress = 0;
      this.pdfFileType = isSample ? "pdf_sample" : this.fullFileType;
      const onProgress = (percent) => {
        this.progress = percent;
      };

      try {
        // toRaw: the exporter walks every message, and reading them through
        // the reactive proxy would make this component depend on all of them.
        const chat = toRaw(this.chat);
        const attachments = toRaw(this.attachments);

        const blob = this.chatView
          ? await renderChatViewPdf({
              chat,
              attachments,
              options: { ...this.chatView.options },
              title: this.chatView.title,
              labels: this.chatView.labels,
              locale: this.chatView.locale,
              assets: this.chatView.currentAssets
                ? await this.chatView.currentAssets()
                : this.chatView.assets,
              isSample,
              onProgress,
            })
          : this.court
            ? await renderCourtPdf({
                chat,
                attachments,
                isSample,
                source: toRaw(this.source),
                onProgress,
              })
            : await renderChatPdf({
                chat,
                attachments,
                ego: this.ego,
                isSample,
                // the court transcript shows no charts, so only this one
                // rasterises them
                charts: await this.loadCharts(),
                onProgress,
              });

        if (this.isUnmounted) return;
        FileSaver.saveAs(blob, this.fileName);
        // file_download fires when the build starts; this proves it finished
        analyticsChat.pdfGenerated(this.pdfFileType);
        this.isLoading = false;
      } catch (error) {
        this.pdfErrorHandler(error);
      }
    },
    /**
     * Snapshot the charts as images first: they are canvases on this page,
     * and the exporter lays out in its own isolated frame.
     */
    async loadCharts() {
      return [
        { name: "Chat Timeline", chart: await loadImage("#chat-timeline") },
        {
          name: "Time of Day",
          chart: await loadImage("#messages-per-time-of-day"),
        },
        {
          name: "Messages per Person",
          chart: await loadImage("#messages-per-person"),
        },
        { name: "Messages per Month", chart: await loadImage("#radar-month") },
        { name: "Messages per Time", chart: await loadImage("#radar-day") },
      ];
    },
    downloadSample() {
      const query = (this.$route && this.$route.query) || {};
      this.download(!("free" in query));
    },
    pdfErrorHandler(error) {
      console.error("PDF generation failed", error);
      this.$sentry?.captureException(error);
      this.isLoading = false;
      this.progress = 0;
    },
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
