<template>
  <v-container>
    <div class="text-h3 font-weight-bold text-center">Your Chat</div>
    <div class="text-center my-4">
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn color="primary" dark v-bind="attrs" v-on="on">
            Change Point of View
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
    <v-container class="chat">
      <v-row
        v-for="(data, idx) in chat.chatObject.slice(
          startIdx,
          startIdx + offset
        )"
        no-gutters
        :key="idx"
        class="scroll-stop"
      >
        <v-sheet
          elevation="1"
          max-width="50%"
          rounded="lg"
          class="pa-2 ma-2"
          color="rgb(38, 45, 49)"
          :class="{
            myMessage: selectedEgo
              ? selectedEgo === data.author
              : chat.messagesPerPerson[0].name === data.author,
            system: chat.personColorMap[data.author] === undefined,
          }"
        >
          <div
            class="text-small font-weight-bold author text-left"
            :style="'color: ' + chat.personColorMap[data.author]"
          >
            {{ data.author }}
          </div>

          <div v-if="data.media">
            <v-img contain width="100%" />
          </div>

          <div
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
        class="my-8"
        v-if="
          chat.chatObject.slice(startIdx + offset, startIdx + 2 * offset)
            .length > 0
        "
      >
        <v-btn
          class="ma-auto white--text"
          @click="startIdx += offset"
          color="rgb(14, 97, 98)"
        >
          Load next {{ offset }} messages</v-btn
        >
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import { getDateString } from "~/functions/utils";

export default {
  name: "Chat",
  computed: {},
  data() {
    return {
      startIdx: 0,
      selectedEgo: "",
      offset: 50,
    };
  },
  props: ["chat"],
  methods: {
    parseMessage(message) {
      var validUrl = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
          "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
          "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
          "(\\#[-a-z\\d_]*)?$",
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
      this.selectedEgo = name;
    },
    _getDateString(date) {
      return getDateString(date);
    },
  },
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
  margin: auto !important;
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
