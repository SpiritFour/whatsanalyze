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
            <HeaderCta
              titelH1="Export your WhatsApp Chat to PDF in seconds"
              titelH2="Get all your chats PDFs, while all data stays on your device."
            />
            <FileHandler
              id="fileHandler"
              v-if="$vuetify.breakpoint.mdAndUp"
              @new_messages="newMessages"
              @hide_explanation="isShowingChats = $event"
            />
          </v-col>
          <v-col v-if="!isShowingChats" cols="12" md="6"> </v-col>
        </v-row>
        <v-row v-if="$vuetify.breakpoint.smAndDown" class="top-color ma-0">
          <v-col>
            <FileHandler
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
      <Content :page="page" />
    </v-container>

    <v-container v-if="isShowingChats">
      <ChartsResults ref="results" :chat="chat_" />
      <DownloadPopup :results="$refs.results" :chat="this.chat_" />
    </v-container>
  </div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";
import html2canvas from "html2canvas";
import { downloadBase64File } from "~/functions/utils";

export default {
  async asyncData({ $content }) {
    const page = await $content("whatsapp-to-pdf").fetch();
    return {
      page,
    };
  },
  head: {
    title: "WhatsAnalyze - How to Export your WhatsApp Chat to PDF",
    meta: [
      {
        hid: "description",
        name: "description",
        content:
          "Export your Whatsapp chat to PDF in seconds ✓ Now working for Group Chats ✓ Create your own PDF Book ✓ No Chat Data is sent to a Server. Get Started now!",
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
      chat_: new Chat(),
      downloading: false,
    };
  },
  methods: {
    Chat,
    newMessages(messages) {
      this.chat_ = new Chat(messages);
    },
    downloadImage() {
      this.downloading = true;
      html2canvas(this.$refs.results.$el, {
        scrollX: 0,
        scrollY: -window.scrollY,
      }).then((canvas) => {
        let names = this.chat_.messagesPerPerson
          .slice(0, 2)
          .map((person) => person.name)
          .join("-");
        downloadBase64File(
          canvas.toDataURL(),
          "whatsanlazye-results-" + names + ".png"
        );
        this.downloading = false;
      });
    },
  },
};
</script>

<style lang="scss">
.top-color {
  background-color: $c-blue-accent;
}
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

.cta-bottom {
  text-align: center;
  background: $c-white;
  padding: 1em;
  margin-top: 2em;
  margin-bottom: 2em;
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

.cta-bottom {
  text-align: center;
  background: $c-white;
  padding: 1em;
  margin-top: 2em;
  margin-bottom: 2em;
}

.main-el {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
