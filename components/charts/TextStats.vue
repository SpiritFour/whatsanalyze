<template>
  <div class="px-6">
    <!-- First and last contact -->

    <div class="my-7 text-left">
      <div class="text-h5 text-md-h4 font-weight-bold pa-0" cols="12"
      >{{ $t("firstMessage") }}
      </div>
      <div class="font-weight-bold text-h3 text-md-h2">
        {{ firstDateString }}
      </div>
    </div>

    <div class="my-7 text-right">
      <div class="text-md-h2 text-h3 font-weight-bold ml-auto">
        {{ lastDateString }}
      </div>
      <div class="text-h5 text-md-h4 font-weight-bold pa-0" cols="12"
      >{{ $t("lastMessage") }}
      </div>
    </div>

    <!-- Days you are chatting -->
    <div class="white--text">
      <div class="cyan darken-2 fact-box py-10" cols="12" sm="6">
        <i size="100"
        >mdi-calendar
        </i
        >
        <div>
          <div
            class="text-h5 font-weight-bold pa-0 ma-0 text-center"
            cols="12"
          >
            {{ $t("youChatted") }}
          </div>
        </div>

        <div>
          <div class="text-h1 font-weight-bold text-center pa-0">
            {{ dateDiffs }}
          </div>
        </div>

        <div>
          <div class="text-h5 font-weight-bold pa-0 text-center" cols="12">
            {{ $t("days") }}
          </div>
        </div>
      </div>

      <div class="amber darken-1 fact-box py-10" cols="12" sm="6">
        <i
          color="yellow accent-1"
          size="100"
        >mdi-android-messages
        </i
        >
        <div>
          <div
            class="text-h5 font-weight-bold pa-0 ma-0 text-center"
            cols="12"
          >
            {{ $t("youSent") }}
          </div>
        </div>
        <div>
          <div class="text-h1 font-weight-bold text-center pa-0">
            {{ totalMessages }}
          </div>
        </div>
        <div>
          <div class="text-h5 font-weight-bold pa-0 text-center">
            {{ $t("messages") }}
          </div>
        </div>
      </div>
    </div>

    <!-- Total message count -->

    <!-- Most acrive day -->

    <!-- Total Word count -->

    <!-- Totlal Images/Audio etc shared -->
  </div>
</template>

<script>
import { dateDiffs, firstDate, getDateString, lastDate } from "~/utils/utils";

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
    }
  },
  data() {
    return {};
  },
  methods: {}
};
</script>

<style scoped>
.i {
  opacity: 0.8;
  position: absolute !important;
  left: 10px;
}

.fact-box {
  position: relative;
}
</style>
