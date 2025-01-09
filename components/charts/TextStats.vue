<template>
  <v-container class="px-6">
    <v-row class="white--text" align="stretch">
      <!-- 1st box -->
      <v-col
        class="cyan darken-2 fact-box py-10 h-100 position-relative"
        cols="12"
        sm="4"
      >
        <!-- Icon in the top-left corner -->
        <v-icon
          v-show="$vuetify.breakpoint.mdAndUp"
          color="black"
          size="50"
          style="position: absolute; top: 10px; left: 10px;"
        >
          mdi-calendar
        </v-icon>

        <!-- "You chatted for" -->
        <v-row class="mt-4">
          <v-col
            cols="12"
            class="text-h5 font-weight-bold pa-0 ma-0 text-center"
          >
            {{ $t("youChattedFor") }}
          </v-col>
        </v-row>

        <!-- Big number: dateDiffs -->
        <v-row>
          <v-col class="text-h1 font-weight-bold text-center pa-0">
            {{ dateDiffs }}
          </v-col>
        </v-row>

        <!-- "days" -->
        <v-row>
          <v-col
            cols="12"
            class="text-h5 font-weight-bold pa-0 text-center"
          >
            {{ $t("days") }}
          </v-col>
        </v-row>
      </v-col>

      <!-- 2nd box -->
      <v-col
        class="amber darken-1 fact-box py-10 h-100 position-relative"
        cols="12"
        sm="4"
      >
        <v-icon
          v-show="$vuetify.breakpoint.mdAndUp"
          color="black"
          size="50"
          style="position: absolute; top: 10px; left: 10px;"
        >
          mdi-android-messages
        </v-icon>

        <!-- "You have sent" -->
        <v-row class="mt-4">
          <v-col
            cols="12"
            class="text-h5 font-weight-bold pa-0 ma-0 text-center"
          >
            {{ $t("youHaveSent") }}
          </v-col>
        </v-row>

        <!-- Big number: totalMessages -->
        <v-row>
          <v-col class="text-h1 font-weight-bold text-center pa-0">
            {{ totalMessages }}
          </v-col>
        </v-row>

        <!-- "Messages" -->
        <v-row>
          <v-col class="text-h5 font-weight-bold pa-0 text-center">
            {{ $t("messages") }}
          </v-col>
        </v-row>
      </v-col>

      <!-- 3rd box -->
      <v-col
        class="pink darken-1 fact-box py-10 h-100 position-relative"
        cols="12"
        sm="4"
      >
        <v-icon
          v-show="$vuetify.breakpoint.mdAndUp"
          color="black"
          size="50"
          style="position: absolute; top: 10px; left: 10px;"
        >
          mdi-phone
        </v-icon>

        <!-- "You called for" -->
        <v-row class="mt-4">
          <v-col
            cols="12"
            class="text-h5 font-weight-bold pa-0 ma-0 text-center"
          >
            {{ $t("youCalledFor") }}
          </v-col>
        </v-row>

        <!-- Big number: totalCallMinutes -->
        <v-row>
          <v-col class="text-h1 font-weight-bold text-center pa-0">
            {{ totalCallMinutes }}
          </v-col>
        </v-row>

        <!-- "minutes" -->
        <v-row>
          <v-col class="text-h5 font-weight-bold pa-0 text-center">
            {{ $t("minutes") }}
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { dateDiffs, firstDate, getDateString, lastDate } from "~/utils/utils";
import { Chat } from "~/utils/transformChatData";

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
      return dateDiffs(this.firstDate, this.lastDate);
    },
    firstDate() {
      return firstDate(this.chat);
    },
    lastDate() {
      return lastDate(this.chat);
    },
    totalMessages() {
      return this.chat.chatObject.length;
    },
    totalCallMinutes() {
      return Chat.getTotalCallMinutes(this.chat.chatObject);
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
.fact-box {
  position: relative;
}
</style>
