import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud";

import Vue from "vue";

Vue.prototype.$am4core = () => {
  return {
    am4core,
    am4themes_animated,
    am4plugins_wordCloud,
  };
};
