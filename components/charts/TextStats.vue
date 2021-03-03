<template>
  <v-container>
    <!-- Days you are chatting -->
    <v-row class="my-16 pa-8 white--text">
      <v-col class="cyan darken-2" style="position: relative" cols="12" sm="6">
        <v-icon size="100">mdi-calendar</v-icon>
        <v-col cols="12" class="text-h5 font-weight-bold pa-0 ma-0 text-center"
          >You chatted for
        </v-col>
        <div class="text-h1 font-weight-bold ma-auto my-0 pa-4">
          {{ dateDiffs }}
        </div>
        <v-col cols="12" class="text-h5 font-weight-bold pa-0 ma-0 text-center"
          >days
        </v-col>
      </v-col>

      <v-col class="amber darken-1" style="position: relative" cols="12" sm="6">
        <v-icon color="yellow accent-1" size="100">mdi-android-messages</v-icon>
        <div class="text-h1 font-weight-bold ma-auto pa-4">
          {{ totalMessages }}
        </div>
        <v-row>
          <v-col cols="12" class="text-h5 font-weight-bold pa-0 text-center"
            >Total Messages
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- First and last contact -->

    <v-row class="my-16 px-5">
      <v-col
        cols="12"
        class="text-h5 text-md-h3 font-weight-bold pa-0 text-left"
        >First Message
      </v-col>
      <div class="font-weight-bold text-h3 text-md-h1">
        {{ firstDateString }}
      </div>
    </v-row>

    <v-row class="my-10 px-5">
      <div class="text-md-h1 text-h3 font-weight-bold ml-auto">
        {{ lastDateString }}
      </div>
      <v-col
        cols="12"
        class="text-h5 text-md-h3 font-weight-bold pa-0 text-right"
        >Last Message
      </v-col>
    </v-row>

    <!-- Total message count -->

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
  left: 10px;
}
</style>
