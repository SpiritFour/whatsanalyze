<template>
  <div>
    <div class="top-color">
      <v-container>
        <v-row no-gutters>
          <v-col
            cols="12"
            :md="isShowingChats ? 12 : 6"
            class="px-0 px-md-16 pb-8"
          >
            <HeaderCta />
            <FileHandler
              ref="filehandler"
              id="fileHandler"
              v-if="$vuetify.breakpoint.mdAndUp"
              @new_messages="newMessages"
              @hide_explanation="isShowingChats = $event"
            />
          </v-col>
          <v-col v-if="!isShowingChats" cols="12" md="6">
            <ChartsExampleGraphs :chat_="chat" />
          </v-col>
        </v-row>
        <v-row v-if="$vuetify.breakpoint.smAndDown">
          <v-col>
            <FileHandler
              ref="filehandler"
              id="fileHandler"
              @new_messages="newMessages"
              @hide_explanation="isShowingChats = $event"
            />
          </v-col>
        </v-row>
      </v-container>
    </div>

    <v-container v-show="!isShowingChats" class="pt-16">
      <ExportExplainer />
      <Cta />
      <Faq />
      <Testimonials />
      <Cta
        title="Analyze your own WhatsApp data now"
        buttonText="Analyze my chat"
        text="Interested about your own chat data? Reveal some interesting facts now.
      Start with figuring out how many toilet rolls would be needed to print
      your whole chat. Take deep dive in your data now!."
      />
    </v-container>
    <v-container v-if="isShowingChats">
      <ChartsResults ref="results" :chat="chat" :attachments="attachments" />
    </v-container>
  </div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";
// import fs from "fs";
// import http from "http";

export default {
  async asyncData({ $content }) {
    const page = await $content("home").fetch();
    return {
      page,
    };
  },
  head: {
    titleTemplate: "WhatsAnalyze - The WhatsApp Chat Analyzer",
    title: "WhatsAnalyze - The WhatsApp Chat Analyzer",
    meta: [
      {
        hid: "description",
        name: "description",
        content:
          "America's Most Popular WhatsApp Analyzer ✓ Now offering Group chats ✓ Reveal your friends character ✓ No Chat Data is sent to a Server. Get Started now!",
      },
      {
        property: "op:image",
        content: "/whatsanalyze-logo-white.png",
      },
    ],
  },

  data() {
    return {
      isShowingChats: false,
      chat: undefined,
      attachments: undefined,
    };
  },
  methods: {
    Chat,
    newMessages(chatObject) {
      // we only update with default chat object if chat_ is undefined
      if (!chatObject.default || this.chat === undefined) {
        this.attachments = chatObject.attachments;
        this.chat = new Chat(chatObject.messages);
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

.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
