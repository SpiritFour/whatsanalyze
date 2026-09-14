<template>
  <div>
    <v-container v-if="oneTimePaymentError || showReuploadHint" class="pb-0">
      <v-alert v-if="oneTimePaymentError" density="compact" type="warning">
        We could not confirm your payment. If you were charged, please contact
        us and we will sort it out.
      </v-alert>
      <v-alert v-else density="compact" type="success">
        Your full chat PDF is paid for. Upload the chat again to download it —
        it never left your device, so we cannot restore it for you.
      </v-alert>
    </v-container>

    <div ref="aboveTheFold" class="top-color">
      <v-container>
        <v-row
          v-if="$vuetify.display.mdAndUp"
          :style="isShowingChats ? 'height: fit-content' : 'min-height: 70vh;'"
          class="center-content"
          no-gutters
        >
          <v-col
            :md="isShowingChats ? 9 : 6"
            class="px-0 px-md-16 pb-8"
            cols="12"
          >
            <v-row
              :style="isShowingChats ? 'height: fit-content' : ''"
              class="center-content"
            >
              <HeaderCta />
              <div v-if="isSubscriptionValid" class="mt-6" style="width: 100%">
                <v-alert density="compact" type="info" prominent>
                  Thanks for supporting us. You can download unlimited PDF's for
                  free.

                  <v-btn to="/subscribe" plain> More Info </v-btn>
                </v-alert>
              </div>

              <ArrowDown :animate="true" />
            </v-row>

            <v-row
              :style="isShowingChats ? 'height: fit-content' : ''"
              class="center-content filehandler"
            >
              <FileHandler
                :style="isShowingChats ? 'max-width: 800px' : ''"
                class=""
                style="align-self: end; width: 100%"
                @hide_explanation="isShowingChats = $event"
                @new_messages="newMessages"
              />
            </v-row>
          </v-col>
          <v-col v-if="!isShowingChats" cols="12" md="6">
            <ChartsExampleGraphs :chat_="chat" />
          </v-col>
        </v-row>
        <v-row v-if="$vuetify.display.smAndDown" no-gutters>
          <v-col class="px-0 pb-1 my-auto" cols="12">
            <HeaderCta />

            <div v-if="isSubscriptionValid" class="mt-6" style="width: 100%">
              <v-alert density="compact" type="info" prominent>
                Thanks for supporting us. You can download unlimited PDF's for
                free.

                <v-btn to="/subscribe" plain> More Info </v-btn>
              </v-alert>
            </div>
          </v-col>
          <v-col cols="12">
            <ArrowDown :animate="true" style="width: 100%; overflow: hidden" />
          </v-col>
          <v-col class="pt-0">
            <FileHandler
              class="filehandler"
              @hide_explanation="isShowingChats = $event"
              @new_messages="newMessages"
            />
          </v-col>
          <v-col v-if="!isShowingChats" cols="12" md="6">
            <ChartsExampleGraphs :chat_="chat" />
          </v-col>
        </v-row>
        <v-alert
          prominent
          dark
          class="mt-6 elevation-3 wrapped-banner"
          style="border-radius: 12px; overflow: hidden; border: none"
        >
          <template #prepend>
            <v-icon large class="mr-4">mdi-party-popper</v-icon>
          </template>

          <v-row align="center" no-gutters>
            <v-col cols="12" md="8" lg="9">
              <div class="text-h6 text-sm-h5 font-weight-bold text-white mb-1">
                WHATSAPP WRAPPED 2026 IS HERE!
              </div>
              <div class="text-subtitle-1 text-white" style="line-height: 1.4">
                Your chat, told like a story. See your most active hours,
                funniest exchanges, and emotional peaks.
                <strong>100% Private.</strong>
              </div>
            </v-col>
            <v-col
              cols="12"
              md="4"
              lg="3"
              class="text-center text-md-right mt-4 mt-md-0"
            >
              <v-btn
                color="white"
                x-large
                class="font-weight-bold px-8"
                rounded
                :to="localePath('/wrapped')"
              >
                See Your Story
                <v-icon right>mdi-arrow-right</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-alert>
      </v-container>
    </div>

    <TrustLogos v-if="!isShowingChats" />
    <v-container v-show="!isShowingChats" class="pt-md-16">
      <ExportExplainer class="exportexplainer" />
      <Cta show-image />
      <Faq />
      <Testimonials />
      <About />
      <PdfExample />
      <Cta
        button-txt="generateYourChatPDF"
        text="getChatBeautiful"
        title="getFreePDFPreview"
      />
    </v-container>

    <v-container v-if="isShowingChats" id="results" class="py-4">
      <ChartsResults
        ref="results"
        :attachments="attachments"
        :chat="chat"
        :is-valid-subscription="isSubscriptionValid"
      />
    </v-container>
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
import { debounce } from "lodash-es";
import { useSubscriptionStore } from "~/stores/subscription";
import { storeToRefs } from "pinia";
import {
  saveChatSession,
  loadChatSession,
  clearChatSession,
} from "~/utils/chatSession";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { scrollToSettled } from "~/utils/scroll";

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
    const { data: page } = await useAsyncData("content-home", () =>
      queryCollection("pages").path("/home").first()
    );
    return {
      locale,
      localePath,
      page,
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
    this.handleDebouncedScroll = debounce(this.handleScroll, 0);
    window.addEventListener("scroll", this.handleDebouncedScroll);

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
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleDebouncedScroll);
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
        const functions = this.$wrappedFunctions || this.$functions;
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
    rando() {
      throw Error("random errro");
    },
    handleScroll() {
      if (this.$refs.aboveTheFold) {
        this.$refs.aboveTheFold.scrollTop = window.scrollY;
      }
    },
  },
};
</script>

<style lang="scss">
.v-btn {
  text-transform: none !important;
}

@media (min-width: 760px) {
  .testimonial {
    min-width: 300px;
    width: 50%;
    float: left;
    padding: 3em;
  }
}

@media (min-width: 760px) {
  .testimonial {
    min-width: 300px;
    width: 50%;
    float: left;
    padding: 3em;
  }

  .explainer {
    min-width: 150px;
    max-width: 25%;
    float: left;
    padding: 1em;
  }

  .explainer-list p {
    margin-right: 10%;
    display: inline;
  }
}

.explainer-list {
  overflow: hidden;
  margin-left: 10%;
  margin-bottom: 40px;
  margin-top: 20px;
}

.explainer-list p {
  font-size: 1.2em;
}

.explainer h2 {
  min-height: 3em;
}

.explainer img {
  max-height: 200px;
  padding: 1em;
}

@media (min-width: 761px) {
  .explainer {
    min-width: 150px;
    max-width: 25%;
    float: left;
    padding: 3em;
  }

  .explainer-list p {
    display: inline;
    padding: 1em;
    width: 33%;
  }

  .testimonial {
    width: 100%;
    padding: 3em;
  }
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

.center-content {
  justify-content: center;
}

.overflow-hidden {
  overflow: hidden;
}

.loading {
  display: inline-block;
  position: relative;
  width: 100%;
  height: 10px;
  background: black;
  animation: lds-dual-ring 2s linear infinite;
  overflow: hidden;
}

@keyframes lds-dual-ring {
  0% {
    transform: translateX(0);
  }

  33% {
    transform: translateX(100%);
  }

  66% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(0);
  }
}

.wrapped-banner {
  /* A rich gradient that looks premium against the teal background */
  background: linear-gradient(90deg, #4527a0 0%, #7b1fa2 100%) !important;
}
</style>
