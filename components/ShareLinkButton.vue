<template>
  <div class="wa-scope text-center">
    <UiButton size="lg" :loading="busy" @click="share">
      {{ shareLabel }}
    </UiButton>

    <p class="m-0 mt-3 text-sm text-wa-ink-faint">
      {{ $t("shareLinkOnlyResults") }}
    </p>

    <div
      v-if="shareUrl"
      class="mx-auto mt-5 max-w-xl break-words rounded-token-lg bg-wa-surface-muted p-4 text-left text-xs text-wa-ink-muted"
    >
      {{ shareUrl }}
    </div>

    <p v-if="errorText" class="m-0 mt-4 text-sm text-[#d93b3b]">
      {{ errorText }}
    </p>
    <p v-else-if="messageText" class="m-0 mt-4 text-sm text-wa-accent">
      {{ messageText }}
    </p>
  </div>
</template>

<script>
import { ChatTooLargeError, buildShareLinkUrl } from "~/utils/social/shareLink";
import { captureAnalysis } from "~/utils/social/analysisSnapshot";
import { storeSharedAnalysis } from "~/utils/social/shareLinkStore";
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
      busy: false,
      shareUrl: "",
      messageKey: null,
      errorKey: null,
      canNativeShare: false,
    };
  },
  computed: {
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
        // The finished charts, not the chat they were drawn from. Nothing
        // that could be read back as a conversation leaves the browser.
        const url =
          this.shareUrl ||
          buildShareLinkUrl(
            window.location.origin,
            this.localePath("/shared"),
            await storeSharedAnalysis(await captureAnalysis(this.chat)),
          );
        this.shareUrl = url;

        if (this.canNativeShare) {
          await navigator.share({
            title: this.$t("shareLinkTitle"),
            text: this.$t("shareLinkInviteText"),
            url,
          });
          this.messageKey = "shareLinkShared";
          analyticsChat.share("native_share", "results_link");
        } else {
          await this.copy(url);
          this.messageKey = "shareLinkCopied";
          analyticsChat.share("clipboard", "results_link");
        }
      } catch (error) {
        if (error instanceof ChatTooLargeError) {
          this.errorKey = "shareLinkTooLarge";
        } else if (error?.name !== "AbortError") {
          // An abort is the native sheet being dismissed; the link is made and
          // on screen, so there is nothing to report.
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
