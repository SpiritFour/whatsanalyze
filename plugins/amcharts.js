import { defineNuxtPlugin } from '#app';

import * as am5core from "@amcharts/amcharts5";
import am5themes_animated from "@amcharts/amcharts5/themes/Animated";
import * as am5plugins_wordCloud from "@amcharts/amcharts5/wc";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.globalProperties.$am5core = () => {
    return {
      am5core,
      am5themes_animated,
      am5plugins_wordCloud,
    };
  };
});