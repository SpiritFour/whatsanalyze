<template>
  <div class="landing-page">
    <div v-if="oneTimePaymentError || showReuploadHint" class="home-notice">
      <v-alert v-if="oneTimePaymentError" density="compact" type="warning">
        We could not confirm your payment. If you were charged, please contact
        us and we will sort it out.
      </v-alert>
      <v-alert v-else density="compact" type="success">
        Your full chat PDF is paid for. Upload the chat again to download it —
        it never left your device, so we cannot restore it for you.
      </v-alert>
    </div>

    <LandingHero
      :eyebrow="$t('homeLanding.heroEyebrow')"
      :title="$t('analyzeInSeconds')"
      :subtitle="$t('homeLanding.heroSubtitle')"
      :note="$t('toolsHub.heroNote')"
    >
      <div id="dropzone-slot" class="home-upload">
        <p class="home-upload__specs">
          <span class="home-upload__dot"></span>
          <span class="mono-label">{{ $t("toolDropzone.localEngine") }}</span>
          <span class="home-upload__sep">•</span>
          <span class="mono-label">{{ $t("toolDropzone.zeroCloud") }}</span>
          <span class="home-upload__sep">•</span>
          <span class="mono-label">{{ $t("toolDropzone.private") }}</span>
        </p>

        <FileHandler
          @hide_explanation="isShowingChats = $event"
          @new_messages="newMessages"
        />

        <p v-if="isSubscriptionValid" class="home-upload__subscriber">
          <v-icon size="18" color="#60d8bd">mdi-star-circle-outline</v-icon>
          Thanks for supporting us. You can download unlimited PDF's for free.
          <NuxtLink :to="localePath('/subscribe')">More Info</NuxtLink>
        </p>
      </div>
    </LandingHero>

    <LandingSection
      v-if="isShowingChats"
      id="results"
      theme="light"
      :reveal="false"
      :eyebrow="$t('homeLanding.resultsEyebrow')"
      :title="$t('homeLanding.resultsTitle')"
    >
      <ChartsResults
        ref="results"
        :attachments="attachments"
        :chat="chat"
        :is-valid-subscription="isSubscriptionValid"
      />
    </LandingSection>

    <template v-else>
      <LandingSection
        theme="white"
        :eyebrow="$t('homeLanding.previewEyebrow')"
        :title="$t('homeLanding.previewTitle')"
        :text="$t('homeLanding.previewText')"
      >
        <ChartsExampleGraphs class="home-preview" />
      </LandingSection>

      <LandingSection
        theme="light"
        :eyebrow="$t('toolsHub.sectionStepsEyebrow')"
        :title="$t('howToExportOn')"
      >
        <LandingSteps :steps="exportSteps" />
        <p class="home-guide-link">
          <NuxtLink :to="localePath('/how-to-export-your-whatsapp-chat')">
            {{ $t("toolsHub.guideLink") }} →
          </NuxtLink>
        </p>
      </LandingSection>

      <LandingSection
        theme="dark"
        :eyebrow="$t('toolsHub.sectionToolsEyebrow')"
        :title="$t('toolsHub.sectionToolsTitle')"
        :text="$t('toolsHub.sectionToolsText')"
      >
        <LandingCards :items="toolCards" />
      </LandingSection>

      <LandingSection
        theme="light"
        :eyebrow="$t('homeLanding.wrappedEyebrow')"
        :title="$t('home.hero.english.headline')"
        :text="$t('home.hero.subtitle')"
      >
        <div class="home-wrapped">
          <p class="home-wrapped__tagline">
            {{ $t("home.hero.english.tagline", { year: currentYear }) }}
          </p>
          <LandingButton :to="localePath('/wrapped')">
            {{ $t("homeLanding.wrappedButton") }}
          </LandingButton>
        </div>
      </LandingSection>

      <LandingSection
        theme="white"
        :eyebrow="$t('homeLanding.pdfEyebrow')"
        :title="$t('examplePDF')"
        :text="$t('homeLanding.pdfText')"
      >
        <img
          :src="pdfExampleImage"
          alt="Example PDF generated from a WhatsApp chat export"
          class="home-pdf__image"
          loading="lazy"
        />
        <div class="home-pdf__action">
          <LandingButton
            :to="localePath({ path: '/', hash: '#dropzone-slot' })"
          >
            {{ $t("getFreePDFPreview") }}
          </LandingButton>
        </div>
      </LandingSection>

      <LandingSection
        theme="light"
        :eyebrow="$t('home.press.eyebrow')"
        :title="$t('homeLanding.pressTitle')"
      >
        <div class="home-press">
          <a
            v-for="site in pressQuotes"
            :key="site.source"
            :href="site.href"
            class="home-press__logo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img :src="site.logo" :alt="site.source" loading="lazy" />
          </a>
        </div>
        <LandingQuotes :quotes="quotes" />
      </LandingSection>

      <LandingSection
        id="faq"
        theme="white"
        :eyebrow="$t('homeLanding.faqEyebrow')"
        :title="$t('faqWhatsapp')"
      >
        <LandingFaq :items="faqItems" />
      </LandingSection>

      <LandingSection
        theme="light"
        :eyebrow="$t('homeLanding.aboutEyebrow')"
        :title="$t('about')"
      >
        <p class="home-about" v-html="$t('aboutPoints')"></p>
        <p class="home-guide-link">
          <NuxtLink :to="localePath('/about')">{{ $t("about") }} →</NuxtLink>
        </p>
      </LandingSection>

      <LandingCta
        :title="$t('homeLanding.ctaTitle')"
        :cta-text="$t('analyzeYourChat')"
        :cta-to="localePath({ path: '/', hash: '#dropzone-slot' })"
        :note="$t('ctaBullets')"
        :disclaimer="$t('toolsHub.disclaimer')"
      />
    </template>
  </div>
</template>

<script>
import { httpsCallable } from "firebase/functions";
import { Chat } from "~/utils/transformChatData";
import {
  GTAG_INTERACTION,
  GTAG_LEAD,
  GTAG_NUM_PERSONS,
  GTAG_PAYMENT,
  gtagEvent,
} from "~/utils/gtagValues";
import { useSubscriptionStore } from "~/stores/subscription";
import { storeToRefs } from "pinia";
import {
  saveChatSession,
  loadChatSession,
  clearChatSession,
} from "~/utils/chatSession";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { scrollToSettled } from "~/utils/scroll";
import pdfExampleImage from "~/assets/img/whatsapp export pdf.png";

export default {
  async setup() {
    useSeoMeta({
      title: "WhatsAnalyze - The WhatsApp Chat Analyzer",
      description:
        "Most Popular WhatsApp Analyzer. Reveal chat statistics and export your chat as a PDF without uploading your data.",
      ogTitle: "WhatsAnalyze - The WhatsApp Chat Analyzer",
      ogSiteName: "WhatsAnalyze - The WhatsApp Chat Analyzer",
      ogDescription:
        "Most Popular WhatsApp Analyzer. Reveal chat statistics and export your chat as a PDF without uploading your data.",
      ogUrl: "https://www.whatsanalyze.com",
    });

    const { locale } = useI18n();
    const localePath = useLocalePath();
    const { allTools } = useToolsNav();
    const { data: page } = await useAsyncData("content-home", () =>
      queryCollection("pages").path("/home").first()
    );
    return {
      locale,
      localePath,
      page,
      allTools,
      isSubscriptionValid: storeToRefs(useSubscriptionStore())
        .isSubscriptionValid,
      oneTimePurchase: useOneTimePurchase(),
    };
  },
  data() {
    return {
      isShowingChats: false,
      chat: undefined,
      attachments: undefined,
      loading: false,
      oneTimePaymentError: false,
      pdfExampleImage,
      currentYear: new Date().getFullYear(),
    };
  },
  computed: {
    showReuploadHint() {
      // Paid for the full PDF, but the chat it was bought for is not the one
      // on screen: it is gone (tab closed, too large to keep in
      // sessionStorage) or a different chat was uploaded since.
      return (
        Boolean(this.oneTimePurchase) &&
        !unlocksChat(this.oneTimePurchase, chatFingerprint(toRaw(this.chat)))
      );
    },
    toolCards() {
      return this.allTools.map((tool) => ({
        icon: tool.icon,
        title: tool.title,
        text: tool.text,
        to: tool.to,
        linkText: this.$t("toolsHub.openTool"),
      }));
    },
    exportSteps() {
      return [1, 2, 3].map((step) => ({
        title: this.$t(`toolsHub.step${step}Title`),
        text: this.$t(`toolsHub.step${step}Text`),
      }));
    },
    // The press quotes are translated and live with the Wrapped messages —
    // the homepage shows the same three, rather than a German-only copy.
    pressQuotes() {
      const quotes = this.$tm("home.press.quotes");
      return Array.isArray(quotes) ? quotes : [];
    },
    quotes() {
      return [
        ...this.pressQuotes.map((site) => ({
          text: site.quote,
          attribution: site.source,
        })),
        {
          text: this.$t("jennifer"),
          attribution: `Jennifer ${this.$t("says")}`,
        },
        { text: this.$t("lara"), attribution: `Lara ${this.$t("says")}` },
      ];
    },
    faqItems() {
      return [
        { q: this.$t("privacyFAQTitle"), a: this.$t("privacyFAQContent") },
        { q: this.$t("howToExport"), a: this.$t("howToExportLong") },
        { q: this.$t("howToGroup"), a: this.$t("howToGroupLong") },
        { q: this.$t("howToArchiveiOS"), a: this.$t("howToArchiveiOSLong") },
        {
          q: this.$t("howToArchiveAndroid"),
          a: this.$t("howToArchiveAndroidLong"),
        },
        { q: this.$t("howToBackupiOS"), a: this.$t("howToBackupiOSLong") },
        {
          q: this.$t("howToBackupAndroid"),
          a: this.$t("howToBackupAndroidLong"),
        },
      ];
    },
  },
  created() {
    // eslint-disable-next-line no-undef
    if (import.meta.client) {
      Object.keys(this.$route.query).forEach((key) => {
        gtagEvent(key, GTAG_LEAD);
      });
    }
  },
  mounted() {
    const sharedChat = useSharedChat();
    if (
      sharedChat.value &&
      sharedChat.value.messages &&
      sharedChat.value.messages.length > 0
    ) {
      this.isShowingChats = true;
      this.newMessages({
        messages: sharedChat.value.messages,
        attachments: sharedChat.value.attachments || [],
      });
      this.$nextTick(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    } else {
      const savedSession = loadChatSession();
      if (savedSession && savedSession.messages?.length > 0) {
        try {
          this.isShowingChats = true;
          this.newMessages({
            messages: savedSession.messages,
            attachments: savedSession.attachments || [],
          });
        } catch (err) {
          // A chat we cannot rebuild must not take the whole page down with
          // it — drop it and show the upload form instead.
          console.error("Could not restore the previous chat:", err);
          clearChatSession();
          this.isShowingChats = false;
          this.chat = undefined;
        }
      }
    }

    useOneTimePurchase().value = restoreOneTimePurchase();
    this.confirmOneTimePayment();

    // Arriving from "Open Chat Analyzer" on the subscribe page: they came for
    // their download, so take them to it rather than to the hero.
    if (this.$route.hash === "#payButton" && this.isShowingChats) {
      this.$nextTick(() => scrollToSettled("#payButton", { offset: 100 }));
    }
  },
  methods: {
    Chat,
    /**
     * Stripe sends the buyer back here after a one-time PDF payment. Confirm
     * the session really was paid, then unlock the full PDF and let it
     * download on its own — the buyer already clicked "buy", asking them to
     * find the button again is not a delivery.
     */
    async confirmOneTimePayment() {
      const {
        payment_success: paymentSuccess,
        session_id: sessionId,
      } = this.$route.query;

      if (paymentSuccess !== "true" || !sessionId) return;

      // Never leave the ids in the URL: a reload or a shared link would
      // re-run this, and the session id is the proof of payment.
      const query = { ...this.$route.query };
      delete query.payment_success;
      delete query.session_id;
      this.$router.replace({ query });

      try {
        const functions = this.$functions;
        const getCheckoutSession = httpsCallable(
          functions,
          "getCheckoutSession"
        );
        const res = await getCheckoutSession({ sessionId });
        const session = res.data;

        if (session?.payment_status !== "paid") {
          console.warn(
            "Checkout session is not paid:",
            session?.payment_status
          );
          return;
        }

        gtagEvent("approved", GTAG_PAYMENT, 10);
        useOneTimePurchase().value = persistOneTimePurchase(sessionId);
      } catch (err) {
        console.error("Could not confirm the one-time payment:", err);
        this.oneTimePaymentError = true;
      }
    },
    newMessages(chatObject) {
      // we only update with default chat object if chat_ is undefined
      if (!chatObject.default || this.chat === undefined) {
        this.attachments = chatObject.attachments;
        this.chat = new Chat(chatObject.messages);
        if (this.chat.numPersonsInChat <= 2) {
          gtagEvent("analyzed_pair_chat", GTAG_INTERACTION, 0);
        } else {
          gtagEvent("analyzed_group_chat", GTAG_INTERACTION, 0);
        }
        gtagEvent(
          "analyzed_chat_" + this.chat.numPersonsInChat,
          GTAG_NUM_PERSONS,
          0
        );
        saveChatSession(chatObject);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.home-notice {
  padding: 1rem 1.5rem 0;
  max-width: $wa-shell-width;
  margin: 0 auto;
}

.home-upload {
  max-width: 640px;
  margin: 0 auto;
  scroll-margin-top: 6rem;
}

.home-upload__specs {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $wa-ink-invert-faint;
}

.home-upload__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $wa-accent;
  box-shadow: 0 0 8px $wa-accent;
  animation: home-upload-pulse 2s infinite ease-in-out;
}

@keyframes home-upload-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

.home-upload__sep {
  color: rgba(245, 245, 247, 0.3);
}

.home-upload__subscriber {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 1.2rem;
  font-size: 0.9rem;
  color: $wa-ink-invert-muted;

  a {
    color: $wa-accent-light;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.home-preview {
  margin-top: clamp(2.2rem, 5vw, 3.6rem);
}

.home-wrapped {
  margin-top: clamp(2.2rem, 5vw, 3.6rem);
  padding: clamp(2rem, 5vw, 3rem) 1.5rem;
  border-radius: $wa-radius-xl;
  background: linear-gradient(135deg, #4527a0 0%, #1f7a6b 100%);
  color: $wa-ink-invert;
}

.home-wrapped__tagline {
  margin-bottom: 1.6rem;
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  font-weight: 600;
}

.home-pdf__image {
  display: block;
  width: 100%;
  max-width: 720px;
  margin: clamp(2.2rem, 5vw, 3.6rem) auto 0;
  border-radius: $wa-radius-xl;
  border: 1px solid $wa-border;
  box-shadow: $wa-shadow-md;
}

.home-pdf__action {
  margin-top: 2.2rem;
}

.home-press {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: clamp(1.5rem, 5vw, 3.5rem);
  margin-top: clamp(2rem, 4vw, 3rem);

  img {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    filter: grayscale(1);
    opacity: 0.75;
    transition: filter 0.2s ease, opacity 0.2s ease;
  }

  &__logo:hover img {
    filter: none;
    opacity: 1;
  }
}

.home-about {
  max-width: 44rem;
  margin: clamp(2rem, 4vw, 3rem) auto 0;
  font-size: 1.05rem;
  line-height: 1.7;
  color: $wa-ink-muted;
}

.home-guide-link {
  margin-top: 2rem;
  text-align: center;

  a {
    color: $wa-accent-dark;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
