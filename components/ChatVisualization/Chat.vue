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
            v-for="(color, name) in colors"
            :key="name"
            @click="changeEgoTo(name)"
          >
            <v-list-item-title :style="'color: ' + color">{{
              name
            }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <!-- Chat -->
    <v-container class="chat">
      <v-row v-for="(data, idx) in chat.chatObject" no-gutters :key="idx">
        <v-sheet
          elevation="1"
          max-width="40%"
          rounded="lg"
          class="pa-2 ma-2"
          color="rgb(38, 45, 49)"
          :class="{
            myMessage: selectedEgo
              ? selectedEgo === data.author
              : chat.messagesPerPerson[0].name === data.author,
            system: colors[data.author] === undefined,
          }"
        >
          <div
            class="text-small font-weight-bold author text-left"
            :style="'color: ' + colors[data.author]"
          >
            {{ data.author }}
          </div>

          <div v-if="data.media">
            <v-img contain width="100%" />
          </div>

          <div class="white--text message">
            {{ data.message }}
          </div>

          <div
            class="text-caption text-right date pt-2"
            style="color: rgb(204, 204, 204)"
          >
            {{ getDateString(data.date) }}
          </div>
        </v-sheet>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
export default {
  name: "Chat",
  computed: {
    colors() {
      let colors = {};
      this.chat.messagesPerPerson.forEach((person) => {
        colors[person.name] = person.color;
      });
      return colors;
    },
  },
  data() {
    return {
      selectedEgo: "",
    };
  },
  props: ["chat"],
  methods: {
    validURL(str) {
      var pattern = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
          "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
          "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
          "(\\#[-a-z\\d_]*)?$",
        "i"
      ); // fragment locator
      return !!pattern.test(str);
    },
    changeEgoTo(name) {
      this.selectedEgo = name;
    },
    getDateString(date) {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const day = date.getDay();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hour = date.getHours();
      const min = date.getMinutes();

      return day + " " + month + " " + year + ", " + hour + ":" + min;
    },
  },
};
</script>

<style scoped>
.chat {
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
