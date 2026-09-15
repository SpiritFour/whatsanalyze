<template>
  <div>
    <LandingHero
      :eyebrow="$t('homeLanding.heroEyebrow')"
      :title="$t('analyzeInSeconds')"
      :subtitle="$t('homeLanding.heroSubtitle')"
      :note="$t('toolsHub.heroNote')"
    >
      <div class="pwa-results__upload">
        <FileHandler ref="filehandler" @new_messages="newMessages" />
      </div>
    </LandingHero>
    <ChartsResults ref="results" :chat="chat" :attachments="attachments" />
  </div>
</template>

<script>
import { Chat } from "~/utils/transformChatData";

export default {
  name: "PwaResults",
  setup() {
    useHead({
      meta: [
        {
          name: "robots",
          content: "noindex",
        },
      ],
    });
  },
  data() {
    return {
      chat: undefined,
      attachments: undefined,
    };
  },
  created() {
    if (import.meta.client) {
      this.setupWorkBox();
    }
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
};
</script>

<style lang="scss" scoped>
.pwa-results__upload {
  max-width: 640px;
  margin: 0 auto;
}
</style>
