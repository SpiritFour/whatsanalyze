<template>
  <div>
    <v-btn @click="rando"></v-btn>
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
            <ChartsExampleGraphs :chat_="chat_" />
          </v-col>
        </v-row>
        <v-row v-if="$vuetify.breakpoint.smAndDown" class="top-color ma-0">
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
      <ChartsResults ref="results" :chat_="chat_" />
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
    const page = await $content("home").fetch();
    return {
      page,
    };
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
    async rando() {
      // var url = new URL("/data2", window.location.origin);
      //
      // var params = { files: [await fetch("/chat_example.txt")] }; // or:
      //
      // url.search = new URLSearchParams(params).toString();
      // fetch(url);
      let text = await fetch("/chat_example.txt").then((a) => a.blob());
      console.log("text in rando button", text);
      var data = new FormData();
      data.append("file", text, "rando.txt");
      console.log("formdata in rando button", data.get("file"));
      const requestOptions = {
        method: "POST",
        // headers: { "Content-Type": "text/plain" },
        body: data,
      };
      fetch("/data3", requestOptions).then((response) =>
        console.log("response btn", response)
      );
    },
  },
  created() {
    let _this = this;
    navigator.serviceWorker.addEventListener("message", function (e) {
      console.log("index push", e);
    });
    navigator.serviceWorker.addEventListener("push", (m) => {
      console.log("index push", m);
    });
    if (window.$workbox !== undefined) {
      window.$workbox.then((workbox) => {
        console.log("workbox here", workbox);
        if (workbox) {
          workbox.addEventListener("installed", (event) => {
            // If we don't do this we'll be displaying the notification after the initial installation, which isn't perferred.
            if (event.isUpdate) {
              // whatever logic you want to use to notify the user that they need to refresh the page.
            }
          });
          workbox.addEventListener("push", (m) => {
            console.log("index push wb", m);
          });
          workbox.addEventListener("message", (m) => {
            console.log(m.data.file); //contains the file(s)
            console.log("index message wb", m);
            _this.chat_ = new Chat();
            let files = m.data.file;
            if (Array.isArray(files)) files = files[0];
            _this.$refs.filehandler.processFile(files);
          });
          workbox.messageSW("SHARE_READY");
        }
      });
    }
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
