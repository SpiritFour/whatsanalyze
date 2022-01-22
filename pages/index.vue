<template>
  <div>
    <div class="top-color">
      <v-container>
        <v-row v-if="$vuetify.breakpoint.mdAndUp" no-gutters style="height: 70vh">
          <v-col
            :md="isShowingChats ? 12 : 6"
            :style="isShowingChats? 'height: fit-content' : ''"
            class="px-0 px-md-16 pb-8"
            cols="12"
          >
            <v-row style="height: 35vh">
              <HeaderCta />
            </v-row>
            <v-row style="height: 35vh; justify-content: center;">
              <FileHandler
                :style="isShowingChats? 'max-width: 800px' : ''"
                class="filehandler"
                style="align-self:end; width: 100%"
                @hide_explanation="isShowingChats = $event"
                @new_messages="newMessages"
              />
            </v-row>
          </v-col>
          <v-col v-if="!isShowingChats" cols="12" md="6">
            <ChartsExampleGraphs :chat_="chat" />
          </v-col>
        </v-row>
        <v-row v-if="$vuetify.breakpoint.smAndDown" no-gutters>
          <v-col :md="isShowingChats ? 12 : 6" class="px-0 pb-1" cols="12">
            <HeaderCta />
          </v-col>
          <v-col class="pt-0">
            <FileHandler
              class="filehandler"
              @hide_explanation="isShowingChats = $event"
              @new_messages="newMessages"
            />
          </v-col>
          <v-col v-if="!isShowingChats" cols="12" md="6">
            <TrustLogos />
            <ChartsExampleGraphs :chat_="chat" />
          </v-col>
        </v-row>
      </v-container>
    </div>
    <TrustLogos v-if="!isShowingChats" />
    <v-container v-show="!isShowingChats" class="pt-16">
      <ExportExplainer />
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

    <v-container v-if="isShowingChats">
      <ChartsResults ref="results" :attachments="attachments" :chat="chat" />
    </v-container>
  </div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";
import { GTAG_INTERACTION, GTAG_LEAD, GTAG_NUM_PERSONS, gtagEvent } from "~/functions/gtagValues";

export default {
  async asyncData({ $content }) {
    const page = await $content("home").fetch();
    return {
      page
    };
  },
  data() {
    return {
      isShowingChats: false,
      chat: undefined,
      attachments: undefined,
      loading: false
    };
  },
  head() {
    return {
      title: "WhatsAnalyze - The WhatsApp Chat Analyzer",
      meta: [
        {
          hid: "og:title",
          name: "og:title",
          property: "og:title",
          content: "WhatsAnalyze - The WhatsApp Chat Analyzer"
        },
        {
          hid: "og:site_name",
          name: "og:site_name",
          property: "og:site_name",
          content: "WhatsAnalyze - The WhatsApp Chat Analyzer"
        },
        {
          hid: "description",
          name: "description",
          property: "description",
          content:
            "America's Most Popular WhatsApp Analyzer ✓ Now offering Group chats ✓ Reveal your friends character ✓ No Chat Data is sent to a Server. Get Started now!"
        },
        {
          hid: "og:description",
          name: "og:description",
          property: "og:description",
          content:
            "America's Most Popular WhatsApp Analyzer ✓ Now offering Group chats ✓ Reveal your friends character ✓ No Chat Data is sent to a Server. Get Started now!"
        },
        {
          hid: "og:url",
          name: "og:url",
          property: "og:url",
          content: "whatsanalyze.com"
        }
      ]
    };
  },
  created() {
    // eslint-disable-next-line no-undef
    if (process.client) {
      Object.keys(this.$route.query).forEach((key) => {
        gtagEvent(key, GTAG_LEAD);
      });
    }
  },
  methods: {
    Chat,
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
      }
    },
    rando() {
      throw Error("random errro");
    }
  }
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
</style>
