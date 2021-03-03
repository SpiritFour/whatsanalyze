<template>
  <v-container>
    <!-- Days you are chatting -->
    <v-row
      class="my-16 cyan darken-2 pa-8 white--text"
      style="position: relative"
    >
      <v-icon size="100">mdi-calendar</v-icon>
      <v-col cols="12" class="text-h3 font-weight-bold pa-0 text-center mb-2"
        >You chatted for
      </v-col>
      <div
        class="text-h1 font-weight-bold ma-auto pa-4"
        style="font-size: 10em !important"
      >
        {{ dateDiffs }}
      </div>
      <v-col cols="12" class="text-h3 font-weight-bold pa-0 text-center"
        >days
      </v-col>
    </v-row>

    <!-- First and last contact -->
    <v-row class="my-10">
      <v-col cols="12" class="text-h3 font-weight-bold pa-0 text-right"
        >First Message
      </v-col>
      <div class="text-h1 font-weight-bold ml-auto">
        {{ firstDateString }}
      </div>
    </v-row>

    <v-row class="my-10">
      <v-col cols="12" class="text-h3 font-weight-bold pa-0 text-left"
        >Last Message
      </v-col>
      <div class="text-h1 font-weight-bold text-right">
        {{ lastDateString }}
      </div>
    </v-row>

    <!-- Total message count -->

    <v-row
      class="my-16 amber darken-2 pa-8 white--text"
      style="position: relative"
    >
      <v-icon color="yellow accent-1" size="100">mdi-android-messages</v-icon>

      <div
        class="text-h1 font-weight-bold ma-auto pa-4"
        style="font-size: 10em !important"
      >
        {{ totalMessages }}
      </div>
      <v-col cols="12" class="text-h3 font-weight-bold pa-0 text-center"
        >Total Messages
      </v-col>
    </v-row>

    <!-- Most acrive day -->

    <!-- Total Word count -->

    <!-- Totlal Images/Audio etc shared -->
  </v-container>
</template>

<script>
import { getDateString } from "~/functions/utils";

export default {
  props: ["chat"],
  computed: {
    lastDateString() {
      return getDateString(this.lastDate, false);
    },
    firstDateString() {
      return getDateString(this.firstDate, false);
    },
    dateDiffs() {
      return Math.round(
        Math.abs((this.firstDate - this.lastDate) / (24 * 60 * 60 * 1000))
      );
    },
    firstDate() {
      return this.chat.chatObject[0] ? this.chat.chatObject[0].date : "";
    },
    lastDate() {
      return this.chat.chatObject[0]
        ? this.chat.chatObject.slice(-1).pop().date
        : "";
    },
    totalMessages() {
      return this.chat.chatObject.length;
    },
  },
  data() {
    return {};
  },
  methods: {},
};
</script>

<style scoped>
.v-icon {
  opacity: 0.8;
  position: absolute !important;
}
</style>
