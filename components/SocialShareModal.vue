<template>
  <v-dialog v-model="dialog" max-width="960" scrollable>
    <template #activator="{ props: activatorProps }">
      <v-btn class="btn-color" size="large" v-bind="activatorProps">
        <v-icon class="mr-2">mdi-cellphone-screenshot</v-icon>
        {{ $t("socialShareOpen") }}
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center bg-cyan">
        <div class="text-h5 font-weight-bold">{{ $t("socialShareTitle") }}</div>
        <v-spacer />
        <v-btn icon variant="text" @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="48" />
          <div class="mt-4">{{ $t("socialSharePreparing") }}</div>
        </div>

        <div v-else-if="!cards.length" class="text-center py-12">
          {{ $t("socialShareNoCards") }}
        </div>

        <template v-else>
          <div class="d-flex flex-wrap ga-4 justify-center mb-4">
            <v-btn-toggle
              v-model="format"
              color="primary"
              density="comfortable"
              mandatory
              variant="outlined"
            >
              <v-btn :value="FORMAT_STORY">
                <v-icon class="mr-1">mdi-cellphone</v-icon>
                {{ $t("socialShareFormatStory") }}
              </v-btn>
              <v-btn :value="FORMAT_SQUARE">
                <v-icon class="mr-1">mdi-crop-square</v-icon>
                {{ $t("socialShareFormatSquare") }}
              </v-btn>
            </v-btn-toggle>

            <v-btn-toggle
              v-model="nameMode"
              color="primary"
              density="comfortable"
              mandatory
              variant="outlined"
            >
              <v-btn :value="NAME_MODE_FULL">
                {{ $t("socialShareNamesFull") }}
              </v-btn>
              <v-btn :value="NAME_MODE_FIRST">
                {{ $t("socialShareNamesFirst") }}
              </v-btn>
              <v-btn :value="NAME_MODE_ANONYMOUS">
                {{ $t("socialShareNamesAnonymous") }}
              </v-btn>
            </v-btn-toggle>

            <v-switch
              v-model="hideCounts"
              color="primary"
              density="compact"
              hide-details
              :label="$t('socialShareHideCounts')"
            />
          </div>

          <div class="social-preview">
            <v-btn
              class="social-preview__nav"
              icon
              variant="tonal"
              :aria-label="$t('socialSharePreviousCard')"
              :disabled="cards.length < 2"
              @click="step(-1)"
            >
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>

            <div ref="preview" class="social-preview__stage" />

            <v-btn
              class="social-preview__nav"
              icon
              variant="tonal"
              :aria-label="$t('socialShareNextCard')"
              :disabled="cards.length < 2"
              @click="step(1)"
            >
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <div class="d-flex justify-center ga-2 mt-3">
            <button
              v-for="(card, index) in cards"
              :key="card.id"
              class="social-preview__dot"
              :class="{ 'social-preview__dot--active': index === activeIndex }"
              :aria-label="card.title"
              @click="activeIndex = index"
            />
          </div>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions
        v-if="cards.length && !loading"
        class="flex-wrap ga-2 pa-4"
      >
        <v-btn
          class="btn-color"
          :loading="busy === 'share'"
          @click="shareActiveCard"
        >
          <v-icon class="mr-2">{{
            canShare ? "mdi-share-variant" : "mdi-download"
          }}</v-icon>
          {{ canShare ? $t("socialShareShare") : $t("socialShareDownload") }}
        </v-btn>

        <v-btn
          :loading="busy === 'whatsapp'"
          variant="tonal"
          @click="shareToWhatsApp"
        >
          <v-icon class="mr-2">mdi-whatsapp</v-icon>
          {{ $t("socialShareWhatsApp") }}
        </v-btn>

        <v-btn
          v-if="canCopy"
          :loading="busy === 'copy'"
          variant="tonal"
          @click="copyActiveCard"
        >
          <v-icon class="mr-2">mdi-content-copy</v-icon>
          {{ $t("socialShareCopy") }}
        </v-btn>

        <v-spacer />

        <v-btn :loading="busy === 'zip'" variant="text" @click="downloadAll">
          <v-icon class="mr-2">mdi-folder-zip</v-icon>
          {{ $t("socialShareDownloadAll") }}
        </v-btn>
      </v-card-actions>

      <v-snackbar v-model="feedback.show" :timeout="2500" color="success">
        {{ feedback.text }}
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
import {
  NAME_MODE_ANONYMOUS,
  NAME_MODE_FIRST,
  NAME_MODE_FULL,
  buildSocialCards,
  collectSocialStats,
} from "~/utils/social/cardData";
import {
  FORMAT_SQUARE,
  FORMAT_STORY,
  cardFileName,
  renderCard,
} from "~/utils/social/renderCard";
import {
  buildShareUrl,
  canCopyImages,
  canShareFiles,
  copyCanvasToClipboard,
  downloadCanvas,
  downloadCardsZip,
  openWhatsAppShare,
  shareCanvas,
} from "~/utils/social/share";
import { GTAG_RESULTS, gtagEvent } from "~/utils/gtagValues";

export default {
  name: "SocialShareModal",
  props: {
    chat: { type: Object, required: true },
  },
  data() {
    return {
      dialog: false,
      loading: false,
      busy: null,
      stats: null,
      format: FORMAT_STORY,
      nameMode: NAME_MODE_FIRST,
      hideCounts: false,
      activeIndex: 0,
      feedback: { show: false, text: "" },
      canShare: false,
      canCopy: false,
      FORMAT_STORY,
      FORMAT_SQUARE,
      NAME_MODE_FULL,
      NAME_MODE_FIRST,
      NAME_MODE_ANONYMOUS,
    };
  },
  computed: {
    cards() {
      return buildSocialCards(this.stats, {
        t: this.$t.bind(this),
        nameMode: this.nameMode,
        hideCounts: this.hideCounts,
        locale: this.$i18n.locale,
      });
    },
    activeCard() {
      return this.cards[this.activeIndex] || null;
    },
  },
  watch: {
    dialog(isOpen) {
      if (isOpen) this.prepare();
    },
    cards() {
      if (this.activeIndex >= this.cards.length) this.activeIndex = 0;
      this.refreshPreview();
    },
    format() {
      this.refreshPreview();
    },
    activeIndex() {
      this.refreshPreview();
    },
  },
  mounted() {
    this.canShare = canShareFiles();
    this.canCopy = canCopyImages();
  },
  methods: {
    prepare() {
      gtagEvent("social_cards_opened", GTAG_RESULTS, 1);
      if (this.stats) {
        this.$nextTick(this.refreshPreview);
        return;
      }
      this.loading = true;
      // Let the dialog paint before we walk through every message.
      setTimeout(() => {
        try {
          this.stats = collectSocialStats(this.chat);
        } catch (error) {
          console.error("Could not build social share cards", error);
          this.$sentry?.captureException?.(error);
        }
        this.loading = false;
        this.$nextTick(this.refreshPreview);
      }, 50);
    },
    renderActiveCanvas() {
      if (!this.activeCard) return null;
      return renderCard(this.activeCard, {
        format: this.format,
        tagline: this.$t("socialCardTagline"),
      });
    },
    refreshPreview() {
      this.$nextTick(() => {
        const stage = this.$refs.preview;
        if (!stage) return;
        const canvas = this.renderActiveCanvas();
        stage.replaceChildren();
        if (canvas) stage.appendChild(canvas);
      });
    },
    step(direction) {
      if (!this.cards.length) return;
      this.activeIndex =
        (this.activeIndex + direction + this.cards.length) % this.cards.length;
    },
    shareText(medium) {
      return `${this.$t("socialShareInviteText")}\n${buildShareUrl(medium)}`;
    },
    notify(text) {
      this.feedback = { show: true, text };
    },
    async shareActiveCard() {
      const canvas = this.renderActiveCanvas();
      if (!canvas) return;
      const fileName = cardFileName(this.activeCard, this.format);
      this.busy = "share";
      try {
        if (this.canShare) {
          const shared = await shareCanvas(canvas, {
            fileName,
            title: this.activeCard.title,
            text: this.shareText("native_share"),
          });
          if (shared) {
            gtagEvent(
              `social_card_shared_${this.activeCard.id}`,
              GTAG_RESULTS,
              2
            );
          }
        } else {
          downloadCanvas(canvas, fileName);
          gtagEvent(`social_card_download_${this.activeCard.id}`, GTAG_RESULTS);
          this.notify(this.$t("socialShareDownloaded"));
        }
      } catch (error) {
        console.error("Sharing the card failed", error);
        this.$sentry?.captureException?.(error);
        downloadCanvas(canvas, fileName);
      } finally {
        this.busy = null;
      }
    },
    async copyActiveCard() {
      const canvas = this.renderActiveCanvas();
      if (!canvas) return;
      this.busy = "copy";
      try {
        await copyCanvasToClipboard(canvas);
        gtagEvent("social_card_copied", GTAG_RESULTS, 1);
        this.notify(this.$t("socialShareCopied"));
      } catch (error) {
        console.error("Copying the card failed", error);
        downloadCanvas(canvas, cardFileName(this.activeCard, this.format));
      } finally {
        this.busy = null;
      }
    },
    async shareToWhatsApp() {
      const canvas = this.renderActiveCanvas();
      if (!canvas) return;
      this.busy = "whatsapp";
      try {
        // WhatsApp cannot take an image through a link, so the card is handed
        // over through the native sheet where that exists and downloaded
        // otherwise - either way the invite text lands in the chat.
        if (this.canShare) {
          await shareCanvas(canvas, {
            fileName: cardFileName(this.activeCard, this.format),
            title: this.activeCard.title,
            text: this.shareText("whatsapp"),
          });
        } else {
          downloadCanvas(canvas, cardFileName(this.activeCard, this.format));
          openWhatsAppShare(this.shareText("whatsapp"));
        }
        gtagEvent("social_card_whatsapp", GTAG_RESULTS, 2);
      } catch (error) {
        console.error("Sharing to WhatsApp failed", error);
      } finally {
        this.busy = null;
      }
    },
    async downloadAll() {
      this.busy = "zip";
      try {
        const entries = this.cards.map((card) => ({
          canvas: renderCard(card, {
            format: this.format,
            tagline: this.$t("socialCardTagline"),
          }),
          fileName: cardFileName(card, this.format),
        }));
        await downloadCardsZip(
          entries,
          `whatsanalyze-cards-${this.format}.zip`
        );
        gtagEvent("social_cards_zip", GTAG_RESULTS, 2);
        this.notify(this.$t("socialShareDownloaded"));
      } catch (error) {
        console.error("Building the card archive failed", error);
        this.$sentry?.captureException?.(error);
      } finally {
        this.busy = null;
      }
    },
  },
};
</script>

<style scoped>
.social-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.social-preview__stage {
  display: flex;
  justify-content: center;
  flex: 1 1 auto;
  min-width: 0;
}

.social-preview__stage :deep(canvas),
.social-preview__stage > canvas {
  max-height: 52vh;
  max-width: 100%;
  height: auto;
  width: auto;
  border-radius: 18px;
  box-shadow: 0 18px 45px rgba(15, 32, 39, 0.35);
}

.social-preview__nav {
  flex: 0 0 auto;
}

.social-preview__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(15, 32, 39, 0.25);
  transition: background 0.2s ease, transform 0.2s ease;
}

.social-preview__dot--active {
  background: #07bc4c;
  transform: scale(1.3);
}
</style>
