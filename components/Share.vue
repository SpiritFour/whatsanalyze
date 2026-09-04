<template>
  <v-container ref="container" style="position: relative">
    <div ref="content">
      <slot></slot>
    </div>
    <v-btn
      :loading="loading"
      :disabled="loading"
      class="btn-color-dark"
      icon
      size="x-large"
      data-html2canvas-ignore
      style="position: absolute; right: 0; top: 0"
      @click="share"
    >
      <v-icon v-if="canShare" size="35">mdi-share</v-icon>
      <v-icon v-else size="35">mdi-download</v-icon>
    </v-btn>
  </v-container>
</template>

<script>
import { downloadBase64File } from "~/utils/utils";
import html2canvas from "html2canvas";
import { GTAG_RESULTS, gtagEvent } from "~/utils/gtagValues";

export default {
  name: "Share",
  props: {
    title: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    imageName: {
      type: String,
      default: "whatsanalyze.png",
    },
    useHtml2Canvas: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      canShare:
        (typeof navigator !== "undefined" &&
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({
            files: [new File([], "image.png", { type: "image/png" })],
          })) ||
        false,
      loading: false,
    };
  },
  methods: {
    getTitle(chartName) {
      if (this.title) return this.title;
      const titleMap = {
        "chat-timeline": this.$t("messagesPerDay"),
        "messages-per-person": `${this.$t("messagesPer")} - ${this.$t(
          "person"
        )}`,
        "messages-per-time-of-day": `${this.$t("messagesPer")} - ${this.$t(
          "timeOfDay"
        )}`,
        "radar-month": `${this.$t("messagesPer")} - ${this.$t("month")}`,
        "radar-day": `${this.$t("messagesPer")} - ${this.$t("weekday")}`,
        "fun-facts": "Fun Facts",
        wordcloud: this.$t("wordCloud"),
        emojicloud: "Emojis",
      };
      return (
        titleMap[chartName] || this.$t("analyzeYourChatTitle") || "WhatsAnalyze"
      );
    },
    createBrandedChartCanvas(chartCanvas, title, subtitle) {
      const paddingX = 40;
      const paddingTop = subtitle ? 90 : 70;
      const paddingBottom = 60;

      const width = chartCanvas.width + paddingX * 2;
      const height = chartCanvas.height + paddingTop + paddingBottom;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Solid white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Top brand accent stripe
      ctx.fillStyle = "#07bc4c";
      ctx.fillRect(0, 0, width, 6);

      // Header title
      ctx.fillStyle = "#111827";
      ctx.font =
        "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(title, paddingX, 22);

      if (subtitle) {
        ctx.fillStyle = "#6b7280";
        ctx.font =
          "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(subtitle, paddingX, 54);
      }

      // Top separator line
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingX, paddingTop - 12);
      ctx.lineTo(width - paddingX, paddingTop - 12);
      ctx.stroke();

      // Chart content
      ctx.drawImage(chartCanvas, paddingX, paddingTop);

      // Footer separator line
      const footerY = paddingTop + chartCanvas.height + 16;
      ctx.beginPath();
      ctx.moveTo(paddingX, footerY);
      ctx.lineTo(width - paddingX, footerY);
      ctx.stroke();

      // Footer branding
      ctx.fillStyle = "#07bc4c";
      ctx.font =
        "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText("WhatsAnalyze.com", paddingX, footerY + 24);

      ctx.fillStyle = "#9ca3af";
      ctx.font =
        "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const tagline = "100% Private WhatsApp Chat Analyzer";
      const taglineWidth = ctx.measureText(tagline).width;
      ctx.fillText(tagline, width - paddingX - taglineWidth, footerY + 24);

      return canvas;
    },
    async getCanvas(chartName) {
      const root =
        this.$refs.content || this.$refs.container?.$el || this.$refs.container;
      const rawCanvas = root?.querySelector?.("canvas");

      if (rawCanvas && rawCanvas.width > 0 && rawCanvas.height > 0) {
        const title = this.getTitle(chartName);
        return this.createBrandedChartCanvas(rawCanvas, title, this.subtitle);
      }

      // Fallback for non-canvas elements
      if (this.$refs.content) {
        const contentEl = this.$refs.content;
        const ignored = Array.from(
          contentEl.querySelectorAll("[data-html2canvas-ignore]")
        );
        if (contentEl.hasAttribute("data-html2canvas-ignore")) {
          ignored.push(contentEl);
        }
        ignored.forEach((el) => el.removeAttribute("data-html2canvas-ignore"));

        try {
          const renderedCanvas = await html2canvas(contentEl, {
            backgroundColor: "#ffffff",
            scale: 2,
            logging: false,
            useCORS: true,
          });
          const title = this.getTitle(chartName);
          return this.createBrandedChartCanvas(
            renderedCanvas,
            title,
            this.subtitle
          );
        } finally {
          ignored.forEach((el) =>
            el.setAttribute("data-html2canvas-ignore", "")
          );
        }
      }

      return null;
    },
    async share() {
      if (this.loading) return;
      this.loading = true;

      const defaultSlot = this.$slots.default?.();
      const firstVNode = defaultSlot?.[0];
      const componentName =
        firstVNode?.type?.__name || firstVNode?.type?.name || "chart";
      const chartName = (
        this.$attrs.id || componentName.replace(/([a-z])([A-Z])/g, "$1-$2")
      ).toLowerCase();

      let canvas;
      try {
        canvas = await this.getCanvas(chartName);
      } catch (err) {
        console.error("Failed to generate canvas for share", err);
      }

      if (!canvas) {
        console.error("No canvas found to share");
        this.loading = false;
        return;
      }

      const title = this.getTitle(chartName);
      const shareText = `${title}\n${this.$t(
        "haveALook"
      )}\nhttps://whatsanalyze.com`;
      const fileName = `${chartName}-${this.imageName}`;

      if (this.canShare) {
        gtagEvent("share_" + chartName + "_pressed", GTAG_RESULTS, 0);

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).catch(() => {});
          }
        } catch (_err) {
          // clipboard write is optional best-effort
        }
        canvas.toBlob((blob) => {
          if (!blob) {
            this.loading = false;
            return;
          }

          const file = new File([blob], fileName, { type: "image/png" });
          let payload = {
            title,
            text: shareText,
            files: [file],
          };

          if (navigator.canShare && !navigator.canShare(payload)) {
            payload = { title, files: [file] };
          }

          navigator
            .share(payload)
            .catch((error) => {
              if (
                error &&
                error.name !== "AbortError" &&
                !error.message?.startsWith?.("AbortError:")
              ) {
                this.$sentry?.captureException?.(error);
              }
            })
            .finally(() => {
              this.loading = false;
            })
            .then(() => {
              gtagEvent("share_" + chartName + "_shared", GTAG_RESULTS, 2);
            });
        });
      } else {
        downloadBase64File(canvas, fileName);
        gtagEvent("download_" + chartName, GTAG_RESULTS);
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped></style>
