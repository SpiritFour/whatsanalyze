// amCharts 4 is ~500 KB and only the two word clouds in the results use it.
// Importing it here statically put it in the entry graph of every page,
// including the landing page nobody has uploaded a chat on yet, so it is
// fetched on first use instead. Callers await `$am4core()`.
let loading = null;

const loadAmcharts = () => {
  if (!loading) {
    loading = Promise.all([
      import("@amcharts/amcharts4/core"),
      import("@amcharts/amcharts4/themes/animated"),
      import("@amcharts/amcharts4/plugins/wordCloud"),
    ]).then(([am4core, animated, am4plugins_wordCloud]) => ({
      am4core,
      am4themes_animated: animated.default,
      am4plugins_wordCloud,
    }));
  }
  return loading;
};

export default defineNuxtPlugin(() => ({
  provide: {
    am4core: loadAmcharts,
  },
}));
