import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud";

export default defineNuxtPlugin(() => ({
  provide: {
    am4core: () => ({
      am4core,
      am4themes_animated,
      am4plugins_wordCloud,
    }),
  },
}));
