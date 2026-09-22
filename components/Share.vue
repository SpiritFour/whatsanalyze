<template>
  <div ref="container" class="wa-scope relative">
    <div ref="content">
      <slot></slot>
    </div>
    <button
      type="button"
      :disabled="loading"
      :aria-label="canShare ? 'Share' : $t('downloadResults')"
      data-html2canvas-ignore
      class="absolute right-0 top-0 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-solid border-[rgba(29,29,31,0.08)] bg-white/80 text-wa-ink-faint backdrop-blur transition-colors hover:bg-white hover:text-wa-accent disabled:opacity-50"
      @click="share"
    >
      <span
        v-if="loading"
        class="block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[rgba(29,29,31,0.15)] border-t-wa-accent"
      ></span>
      <svg
        v-else-if="canShare"
        viewBox="0 0 24 24"
        class="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        class="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
      </svg>
    </button>
  </div>
</template>

<script>
import { downloadBase64File } from "~/utils/utils";
import html2canvas from "html2canvas";
import { analyticsChat } from "~/composables/useAnalytics";
import { SVG_CHART_CLASS, chartToCanvas } from "~/utils/svgImage";
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
        "messages-per-person": `${this.$t("messagesPer")} ${this.$t("person")}`,
        "messages-per-time-of-day": `${this.$t("messagesPer")} ${this.$t(
          "hour"
        )}`,
        "radar-month": `${this.$t("messagesPer")} ${this.$t("month")}`,
        "radar-day": `${this.$t("messagesPer")} ${this.$t("weekday")}`,
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
    /**
     * The word and emoji clouds are amCharts SVG, not a canvas. html2canvas
     * never settles on them — it used to leave the share button spinning for
     * good — so they are rasterised directly instead.
     */
    async getCanvas(chartName) {
      const root =
        this.$refs.content || this.$refs.container?.$el || this.$refs.container;
      const rawCanvas = root?.querySelector?.("canvas");
      const title = this.getTitle(chartName);

      if (rawCanvas && rawCanvas.width > 0 && rawCanvas.height > 0) {
        return this.createBrandedChartCanvas(rawCanvas, title, this.subtitle);
      }

      const svgChart = root?.querySelector?.(`.${SVG_CHART_CLASS}`);
      if (svgChart) {
        const chartCanvas = await chartToCanvas(svgChart);
        if (chartCanvas) {
          return this.createBrandedChartCanvas(
            chartCanvas,
            title,
            this.subtitle
          );
        }
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
        canvas = await Promise.race([
          this.getCanvas(chartName),
          new Promise((_resolve, reject) =>
            setTimeout(
              () => reject(new Error("Rendering the image timed out")),
              20000
            )
          ),
        ]);
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
              analyticsChat.share("native_share", chartName);
            });
        });
      } else {
        downloadBase64File(canvas, fileName);
        analyticsChat.share("image_download", chartName);
        analyticsChat.download("chart_image", chartName);
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped></style>
