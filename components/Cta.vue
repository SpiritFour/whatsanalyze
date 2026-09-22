<template>
  <v-container class="cta pt-7 my-5 text-center">
    <div class="text-h2 font-weight-bold mb-7">{{ $t(title) }}</div>

    <v-row v-if="showImage">
      <v-img
        :lazy-src="chatImage"
        :src="chatImage"
        class="ma-auto mt-4 mb-8"
        max-width="250"
      />
    </v-row>
    <span class="text-body-1"> {{ $t(text) }}</span>
    <br />
    <UiButton :to="to || null" size="lg" class="mt-5" @click="clickHandler">
      {{ $t(buttonTxt) }}
    </UiButton>
  </v-container>
</template>

<script>
import { analyticsSite } from "~/composables/useAnalytics";
import chatImage from "~/assets/my-chat.jpg";
import { scrollTo } from "~/utils/scroll";

export default {
  props: {
    showImage: { default: false, type: Boolean },
    to: { default: "", type: String },
    buttonTxt: {
      default: function () {
        return "analyzeYourChat";
      },
      type: String,
    },
    text: {
      default: function () {
        return "analyzeYourChatLong";
      },
      type: String,
    },
    title: {
      default: function () {
        return "analyzeYourChatTitle";
      },
      type: String,
    },
  },
  data() {
    return {
      chatImage,
    };
  },
  methods: {
    clickHandler() {
      if (!this.to) {
        analyticsSite.jumpToUpload("cta");
        // Same selector as ExportExplainer: `.filehandler` matched nothing
        // once the upload box moved to BEM class names, so this CTA scrolled
        // nowhere.
        scrollTo("#dropzone-slot, .file-handler", { offset: 100 });
      }
    },
  },
};
</script>
