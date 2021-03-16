<template>
  <div>
    <v-container class="top-color">
      <HeaderCta />
      <FileHandler ref="filehandler" @new_messages="newMessages" />
    </v-container>
    <ChartsResults ref="results" :chat="chat" :attachments="attachments" />
  </div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";

export default {
  name: "pwa-results",
  head: {
    meta: [
      {
        hid: "robots",
        name: "robots",
        content: "noindex",
      },
    ],
  },
  data() {
    return {
      chat: undefined,
      attachments: undefined,
    };
  },
  methods: {
    Chat,
    newMessages(chatObject) {
      // we only update with default chat object if chatis undefined
      if (!chatObject.default || this.chat === undefined) {
        this.attachments = chatObject.attachments;
        this.chat = new Chat(chatObject.messages);
      }
    },
    setupWorkBox() {
      let _this = this;
      if (window.$workbox !== undefined) {
        window.$workbox.then((workbox) => {
          if (workbox) {
            workbox.addEventListener("message", (m) => {
              // eslint-disable-next-line no-prototype-builtins
              if (_this.$route.query.hasOwnProperty("receiving-file-share")) {
                let files = m.data.file;
                // currently only the first file, but ultimately we want to pass all files
                _this.$refs.filehandler.processFileList(files, true);
              }
            });
            workbox.messageSW("SHARE_READY");
          }
        });
      }
    },
  },
  created() {
    // eslint-disable-next-line no-undef
    if (process.client) {
      this.setupWorkBox();
    }
  },
};
</script>
