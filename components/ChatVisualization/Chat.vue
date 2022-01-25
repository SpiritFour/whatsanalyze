<template>
  <v-container>
    <div class="text-center my-4">
      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn class="btn-color" dark v-bind="attrs" v-on="on">
            {{ $t("changeView") }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="(color, name) in chat.personColorMap"
            :key="name"
            @click="changeEgoTo(name)"
          >
            <v-list-item-title :style="'color: ' + color">
              {{ name }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Chat -->
    <v-container id="chat" class="chat">
      <v-row
        v-for="(data, idx) in chat.chatObject.slice(
          startIdx,
          startIdx + offset
        )"
        :key="idx"
        class="scroll-stop"
        no-gutters
      >
        <v-sheet
          :class="{
            myMessage: selectedEgo
              ? selectedEgo === data.author
              : !!chat.messagesPerPerson[0] &&
                chat.messagesPerPerson[0].name === data.author,
            system: chat.personColorMap[data.author] === undefined,
          }"
          class="pa-2 ma-2"
          color="rgb(38, 45, 49)"
          elevation="1"
          max-width="70%"
          rounded="lg"
        >
          <div
            :style="'color: ' + chat.personColorMap[data.author]"
            class="text-small font-weight-bold author text-left"
          >
            {{ data.author }}
          </div>

          <div v-if="data.media">
            <v-img contain width="100%" />
          </div>

          <Attachment
            v-if="data.attachment"
            :attachment-promise="_getAttachment(data.attachment.fileName)"
          >
          </Attachment>
          <div
            v-else
            class="white--text message"
            v-html="parseMessage(data.message)"
          ></div>

          <div
            class="text-caption text-right date pt-2"
            style="color: rgb(204, 204, 204)"
          >
            {{ _getDateString(data.date) }}
          </div>
        </v-sheet>
      </v-row>
      <v-row
        v-if="
          chat.chatObject.slice(startIdx + offset, startIdx + 2 * offset)
            .length > 0
        "
        class="my-8"
      >
        <v-btn
          class="ma-auto white--text btn-color"
          @click="nextMessages"
        >
          Load next {{ offset }} messages
        </v-btn>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import { getDateString } from "~/functions/utils";
import { getAttachment } from "~/functions/attachments.ts";
import { GTAG_INTERACTION, gtagEvent } from "~/functions/gtagValues";

export default {
  name: "Chat",
  props: ["chat", "attachments"],
  data() {
    return {
      startIdx: 0,
      selectedEgo: "",
      offset: 20
    };
  },
  methods: {
    parseMessage(message) {
      const validUrl = new RegExp(
        "(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?",
        "i"
      );
      const words = message.split(" ");
      let htmlMessage = "";
      words.forEach((word) => {
        if (validUrl.test(word)) {
          htmlMessage +=
            "<a style='word-break: break-all' href=" +
            word +
            ">" +
            word +
            "</a>" +
            " ";
        } else {
          htmlMessage += word + " ";
        }
      });
      return htmlMessage;
    },
    changeEgoTo(name) {
      this.$emit("setEgo", name);
      this.selectedEgo = name;
      gtagEvent("change_ego_chat", GTAG_INTERACTION, 0);
    },
    async _getAttachment(fileName) {
      return await getAttachment(fileName, this.attachments);
    },
    _getDateString(date) {
      return getDateString(date);
    },
    nextMessages() {
      this.startIdx += this.offset;
      const container = this.$el.querySelector("#chat");
      container.scrollTop = 0;
    }
  }
};
</script>

<style scoped>
.scroll-stop {
  scroll-snap-align: start;
}

.chat {
  scroll-snap-type: y mandatory;
  border-radius: 10px;
  width: 100%;
  height: 90vh;
  background-repeat: initial;
  overflow: scroll;
  overflow-x: hidden;
  background-color: rgb(13, 20, 24);
  background-image: url("https://whatsapp-chat-parser.netlify.app/static/media/bg-dark.ffb9199c.png");
}

.myMessage {
  background-color: rgb(14, 97, 98) !important;
  margin-left: auto !important;
}

.message {
  text-align: left;
  word-break: break-word;
}

.system {
  background-color: rgb(53, 53, 38) !important;
  max-width: 70% !important;
  margin-left: auto !important;
  margin-right: auto !important;
  text-align: center;
  word-wrap: break-word;
}

.system .message {
  text-align: center;
  color: rgb(250, 217, 100) !important;
}

.system .author,
.system .date {
  display: none;
}
</style>
