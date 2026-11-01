<template>
  <div class="wa-scope text-center">
    <div
      :class="
        isSimple
          ? ''
          : 'rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-6 shadow-card md:p-8'
      "
    >
      <h3
        v-if="!isSimple"
        class="m-0 text-xl font-bold text-wa-ink md:text-2xl"
      >
        {{ $t("downloadAllGraphs") }}
      </h3>
      <p v-if="!isSimple" class="m-0 mb-6 mt-2 text-sm text-wa-ink-muted">
        {{ $t("shareWithFriends") }}
      </p>

      <v-dialog v-model="dialog" width="600">
        <template #activator="{ props: activatorProps }">
          <UiButton
            :loading="loading"
            size="lg"
            v-bind="activatorProps"
            @click="download"
          >
            <IconDownload v-if="!loading" />
            {{ $t("downloadResults") }}
          </UiButton>
        </template>

        <v-card class="wa-scope relative rounded-token-lg">
          <button
            type="button"
            class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg text-wa-ink-faint hover:bg-[rgba(29,29,31,0.06)] hover:text-wa-ink"
            :aria-label="$t('closeButton')"
            @click="dialog = false"
          >
            ✕
          </button>

          <div class="px-7 py-7 text-left">
            <h3 class="m-0 pr-8 text-xl font-bold text-wa-ink">
              {{ $t("didWeMake") }}
            </h3>
            <p class="m-0 mt-1 text-sm text-wa-ink-muted">
              {{ $t("getResults") }}
            </p>
            <div v-if="loading" class="loading mt-4" />

            <!-- Optional: the image is free, a donation is a thank-you. -->
            <div
              class="mt-6 flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-[rgba(29,29,31,0.08)] pt-5 text-sm text-wa-ink-muted"
            >
              <span>{{ $t("buyUsCoffee") }}</span>
              <form
                ref="paypalForm"
                action="https://www.paypal.com/donate"
                method="post"
                target="_blank"
              >
                <input
                  name="hosted_button_id"
                  type="hidden"
                  value="EPCYG8WEF289G"
                />
                <UiButton variant="secondary" size="sm" @click="donate">
                  {{ $t("donateWithPaypal") }}
                </UiButton>
              </form>
            </div>
          </div>
        </v-card>
      </v-dialog>

      <!-- The other way of sharing results. It sits here rather than in a card
           of its own: both answers to "how do I show someone this" belong in
           the same place. -->
      <div v-if="$slots.secondary && !isSimple" class="mt-6">
        <slot name="secondary" />
      </div>

      <!-- Hidden on a shared analysis: the PDF is built from the chat, and
           the section this jumps to is not on that page. -->
      <div v-if="!isSimple && !hidePdfLink" class="mt-8">
        <p class="m-0 mb-3 text-sm text-wa-ink-muted">
          {{ $t("lookingFor") }}
          <b class="text-wa-ink">{{ $t("pdfDownload") }}</b
          >?
        </p>
        <UiButton variant="secondary" @click="jumpToPdfDownload">
          {{ $t("goToPDF") }}
          <span aria-hidden="true">&rarr;</span>
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script>
import html2canvas from "html2canvas";
import { downloadBase64File } from "~/utils/utils";
import { scrollTo } from "~/utils/scroll";
import { applySvgChartSnapshots, snapshotSvgCharts } from "~/utils/svgImage";
import { analyticsChat, analyticsSite } from "~/composables/useAnalytics";

export default {
  name: "DownloadPopup",
  props: {
    chat: { type: Object },
    isSimple: { default: false, type: Boolean },
    hidePdfLink: { type: Boolean, default: false },
  },
  data() {
    return {
      dialog: false,
      loading: false,
      suffix: this.isSimple ? "-top" : "",
    };
  },
  methods: {
    download: function () {
      this.loading = true;
      analyticsChat.download("chart_image", "graphs");
      setTimeout(async () => {
        const graphs = document.querySelector("#download-graphs");
        // Taken before the capture: html2canvas cannot draw the SVG clouds,
        // and inside onclone there is no room to wait for anything.
        const svgSnapshots = await snapshotSvgCharts(graphs);

        let additionalHeight = 0;
        document
          .querySelectorAll(".additional-height")
          .forEach((a) => (additionalHeight += a.clientHeight));

        let negativeHeight = 0;
        document
          .querySelectorAll("[remove-height-in-html2-canvas]")
          .forEach((a) => (negativeHeight -= a.clientHeight));

        let normalHeight =
          document.querySelector("#download-graphs").clientHeight;

        //wordcloud
        let canvas = html2canvas(document.querySelector("#download-graphs"), {
          scrollX: 0,
          scrollY: -window.scrollY,
          height: normalHeight + additionalHeight + negativeHeight,
          scale: Math.min(window.devicePixelRatio || 1, 2),
          logging: false,
          useCORS: true,
          backgroundColor: "#ffffff",
          onclone: function (clonedDoc) {
            if (clonedDoc.documentElement) {
              clonedDoc.documentElement.style.backgroundColor = "#ffffff";
            }
            if (clonedDoc.body) {
              clonedDoc.body.style.backgroundColor = "#ffffff";
            }
            let nonVisibleStuff = clonedDoc.querySelectorAll(
              ".only-visible-to-html2canvas",
            );
            nonVisibleStuff.forEach((y) => (y.style.display = "block"));
            applySvgChartSnapshots(
              clonedDoc.querySelector("#download-graphs"),
              svgSnapshots,
            );
            return clonedDoc;
          },
        });

        let names = this.chat.messagesPerPerson
          .slice(0, 2)
          .map((person) => person.name)
          .join("-");
        canvas
          .then((renderedCanvas) => {
            downloadBase64File(
              renderedCanvas,
              "whatsanalyze.com-results-" + names + ".png",
            );
          })
          .catch((err) => {
            console.error("Failed to render download canvas", err);
          })
          .finally(() => {
            this.loading = false;
          });
      }, 250);
    },
    donate() {
      this.paypalButtonPressed();
      this.$refs.paypalForm.submit();
    },
    paypalButtonPressed() {
      analyticsSite.donateClicked("results_download");
    },
    jumpToPdfDownload() {
      analyticsSite.jumpToUpload("pdf_download_cta");
      scrollTo("#payButton", { offset: 100 });
    },
  },
};
</script>
