<template>
  <v-container ref="container" style="position: relative">
    <div ref="content">
      <slot></slot>
    </div>
    <v-btn
      :loading="loading"
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
        (navigator.share &&
          navigator.canShare &&
          navigator.canShare({
            files: [new File([], "image.png", { type: "image/png" })],
          })) ||
        false,
      loading: false,
    };
  },
  methods: {
    async getCanvas() {
      if (this.useHtml2Canvas) {
        let currScroll = window.scrollY;

        let offset = 0;
        if (this.$vuetify.display.xs) {
          offset = 340;
        } else if (this.$vuetify.display.sm) {
          offset = 280;
        } else if (this.$vuetify.display.mdAndUp) {
          offset = 260;
        }
        window.scrollTo(0, offset);
        const html = this.$refs.content;
        return html2canvas(html).then((renderedCanvas) => {
          window.scrollTo(0, currScroll);
          return renderedCanvas;
        });
      } else {
        const root =
          this.$refs.content ||
          this.$refs.container?.$el ||
          this.$refs.container;
        return root?.querySelector?.("canvas");
      }
    },
    async share() {
      const defaultSlot = this.$slots.default?.();
      const firstVNode = defaultSlot?.[0];
      const componentName =
        firstVNode?.type?.__name || firstVNode?.type?.name || "chart";
      const chartName = (
        this.$attrs.id || componentName.replace(/([a-z])([A-Z])/g, "$1-$2")
      ).toLowerCase();

      this.loading = true;
      let canvas = await this.getCanvas();
      this.loading = false;

      if (!canvas) {
        console.error("No canvas found to share");
        return;
      }
      if (this.canShare) {
        gtagEvent("share_" + chartName + "_pressed", GTAG_RESULTS, 0);

        canvas.toBlob((blob) => {
          navigator
            .share({
              title: "WhatsAnalze.com",
              text: this.$t("haveALook"),
              files: [
                new File([blob], chartName + "-" + this.imageName, {
                  type: "image/png",
                }),
              ],
            })
            .catch((error) => {
              // Ignore AbortError (User did not want to share)
              // if it does not work, do this: https://stackoverflow.com/questions/49663206/navigator-share-wont-resolve-nor-reject-when-user-cancels-native-selector-on-an
              if (!error.message.startsWith("AbortError:"))
                this.$sentry.captureException(error);
            })
            .then(() => {
              gtagEvent("share_" + chartName + "_shared", GTAG_RESULTS, 2);
            });
        });
      } else {
        downloadBase64File(
          canvas.toDataURL(),
          chartName + "-" + this.imageName
        );

        gtagEvent("download_" + chartName, GTAG_RESULTS);
      }
    },
  },
};
</script>

<style scoped></style>
