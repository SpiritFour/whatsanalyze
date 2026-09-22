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

        <v-card class="wa-scope overflow-hidden rounded-token-lg">
          <div class="bg-wa-accent px-6 py-5 text-white">
            <p class="m-0 text-xl font-bold">{{ $t("didWeMake") }}</p>
            <p class="m-0 mt-1 text-sm opacity-90">{{ $t("buyUsCoffee") }}</p>
          </div>

          <div class="px-6 py-5 text-center">
            <p class="m-0 text-sm text-wa-ink-muted">{{ $t("getResults") }}</p>

            <form
              action="https://www.paypal.com/donate"
              method="post"
              target="_blank"
              class="mt-5"
              @click="paypalButtonPressed"
            >
              <input
                name="hosted_button_id"
                type="hidden"
                value="EPCYG8WEF289G"
              />
              <input
                alt="Donate with PayPal button"
                border="0"
                name="submit"
                src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
                title="PayPal - The safer, easier way to pay online!"
                type="image"
              />
              <img
                alt=""
                border="0"
                height="1"
                src="https://www.paypal.com/en_US/i/scr/pixel.gif"
                width="1"
              />
            </form>

            <div v-if="loading" class="loading mt-4" />
          </div>

          <div
            class="flex justify-end border-0 border-t border-solid border-[rgba(29,29,31,0.08)] px-4 py-3"
          >
            <UiButton variant="danger" size="sm" @click="dialog = false">
              Close
            </UiButton>
          </div>
        </v-card>
      </v-dialog>

      <div v-if="!isSimple" class="mt-8">
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
        canvas.then((renderedCanvas) => {
          downloadBase64File(
            renderedCanvas,
            "whatsanalyze.com-results-" + names + ".png",
          );
          this.loading = false;
        });
      }, 250);
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
