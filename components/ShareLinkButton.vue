<template>
  <div class="wa-scope text-center">
    <v-dialog v-model="dialog" width="560">
      <template #activator="{ props: activatorProps }">
        <UiButton size="lg" v-bind="activatorProps">
          {{ $t("shareLinkOpen") }}
        </UiButton>
      </template>

      <v-card class="wa-scope overflow-hidden rounded-token-lg">
        <div
          class="flex items-start justify-between gap-4 bg-wa-accent px-6 py-5 text-white"
        >
          <div>
            <p class="m-0 text-xl font-bold">{{ $t("shareLinkTitle") }}</p>
            <p class="m-0 mt-1 text-sm opacity-90">
              {{ $t("shareLinkSubtitle") }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 text-white opacity-80 hover:opacity-100"
            :aria-label="$t('closeButton')"
            @click="dialog = false"
          >
            <IconClose />
          </button>
        </div>

        <div class="px-6 py-5">
          <fieldset class="m-0 border-0 p-0">
            <legend
              class="mb-2 p-0 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-wa-ink-faint"
            >
              {{ $t("shareLinkNamesLegend") }}
            </legend>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in nameOptions"
                :key="option.value"
                type="button"
                :class="chipClass(nameMode === option.value)"
                @click="selectNameMode(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </fieldset>

          <label class="mt-5 flex items-center gap-3 text-sm text-wa-ink">
            <input
              v-model="hideCounts"
              type="checkbox"
              class="h-4 w-4 accent-wa-accent"
              @change="reset"
            />
            {{ $t("shareLinkHideCounts") }}
          </label>

          <p class="m-0 mt-5 text-sm text-wa-ink-muted">
            {{ $t("shareLinkPrivacyNote") }}
          </p>

          <div
            v-if="shareUrl"
            class="mt-5 break-words rounded-token-lg bg-wa-surface-muted p-4 text-left text-xs text-wa-ink-muted"
          >
            {{ shareUrl }}
          </div>

          <p v-if="errorText" class="m-0 mt-4 text-sm text-[#d93b3b]">
            {{ errorText }}
          </p>
          <p v-else-if="messageText" class="m-0 mt-4 text-sm text-wa-accent">
            {{ messageText }}
          </p>

          <UiButton
            class="mt-5"
            size="lg"
            block
            :loading="busy"
            :disabled="!cards.length"
            @click="share"
          >
            {{ shareLabel }}
          </UiButton>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import {
  NAME_MODE_ANONYMOUS,
  NAME_MODE_FIRST,
  NAME_MODE_FULL,
  buildSocialCards,
  collectSocialStats,
} from "~/utils/social/cardData";
import { buildShareLinkUrl } from "~/utils/social/shareLink";
import { storeSharedCards } from "~/utils/social/shareLinkStore";
import { analyticsChat } from "~/composables/useAnalytics";

export default {
  name: "ShareLinkButton",
  props: {
    chat: { type: Object, required: true },
  },
  setup() {
    // Options API gets no `this.localePath` from @nuxtjs/i18n v10.
    return { localePath: useLocalePath() };
  },
  data() {
    return {
      dialog: false,
      busy: false,
      nameMode: NAME_MODE_FIRST,
      hideCounts: false,
      shareUrl: "",
      messageKey: null,
      errorKey: null,
      canNativeShare: false,
    };
  },
  computed: {
    nameOptions() {
      return [
        { value: NAME_MODE_FULL, label: this.$t("shareLinkNamesFull") },
        { value: NAME_MODE_FIRST, label: this.$t("shareLinkNamesFirst") },
        { value: NAME_MODE_ANONYMOUS, label: this.$t("shareLinkNamesHidden") },
      ];
    },
    cards() {
      if (!this.dialog) return [];
      return buildSocialCards(collectSocialStats(this.chat), {
        t: this.$t.bind(this),
        nameMode: this.nameMode,
        hideCounts: this.hideCounts,
        locale: this.$i18n.locale,
      });
    },
    shareLabel() {
      return this.canNativeShare
        ? this.$t("shareLinkCreateAndShare")
        : this.$t("shareLinkCreateAndCopy");
    },
    messageText() {
      return this.messageKey ? this.$t(this.messageKey) : "";
    },
    errorText() {
      return this.errorKey ? this.$t(this.errorKey) : "";
    },
  },
  mounted() {
    this.canNativeShare =
      typeof navigator !== "undefined" && Boolean(navigator.share);
  },
  methods: {
    chipClass(active) {
      return [
        "rounded-full border border-solid px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-wa-accent bg-wa-accent text-white"
          : "border-[rgba(29,29,31,0.12)] text-wa-ink hover:border-wa-accent",
      ];
    },
    selectNameMode(value) {
      this.nameMode = value;
      this.reset();
    },
    /**
     * The privacy choices are baked into the stored payload, so a link made
     * under the old ones cannot answer for the new ones. Changing either
     * throws the link away rather than leaving a stale one on screen.
     */
    reset() {
      this.shareUrl = "";
      this.messageKey = null;
      this.errorKey = null;
    },
    async copy(text) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    },
    async share() {
      this.busy = true;
      this.errorKey = null;
      this.messageKey = null;
      try {
        const url =
          this.shareUrl ||
          buildShareLinkUrl(
            window.location.origin,
            this.localePath("/shared"),
            await storeSharedCards(this.cards, this.$i18n.locale),
          );
        this.shareUrl = url;

        if (this.canNativeShare) {
          await navigator.share({
            title: this.$t("shareLinkTitle"),
            text: this.$t("shareLinkInviteText"),
            url,
          });
          this.messageKey = "shareLinkShared";
          analyticsChat.share("native_share", "highlights_link");
        } else {
          await this.copy(url);
          this.messageKey = "shareLinkCopied";
          analyticsChat.share("clipboard", "highlights_link");
        }
      } catch (error) {
        // An abort means the user closed the native sheet; the link is made
        // and on screen, so there is nothing to report.
        if (error?.name !== "AbortError") {
          console.error("Could not create the share link", error);
          this.$sentry?.captureException?.(error);
          this.errorKey = "shareLinkError";
        }
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
