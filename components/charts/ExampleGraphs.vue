<template>
  <div v-if="chat" class="wa-scope grid gap-4 md:grid-cols-2 md:gap-6">
    <ChartsCard :title="$t('exampleGraphSubtitle1')">
      <div class="h-[260px]">
        <ChartsBarChart :chartdata="chat" data-grouping="hourly" compact />
      </div>
    </ChartsCard>

    <ChartsCard :title="$t('exampleGraphSubtitle2')">
      <div class="mx-auto max-w-[260px]">
        <ChartsDonughtChart :chartdata="chat" compact />
      </div>
    </ChartsCard>
  </div>
</template>

<script>
import { Chat } from "~/utils/transformChatData";
import { recolorChartData } from "~/utils/colors";

export default {
  name: "ExampleGraphs",
  data() {
    return {
      chat: undefined,
    };
  },
  created() {
    if (import.meta.client) {
      fetch("/example-results.json")
        .then((response) => response.text())
        .then((messages) => {
          var instance = new Chat();
          var serializedObject = JSON.parse(messages);
          // The file was written with whatever palette was current that day,
          // so the colours are replaced with today's on the way in.
          Object.assign(instance, {
            _lineGraphData: Promise.resolve(
              recolorChartData(serializedObject[0]),
            ),
            _funfacts: Promise.resolve(serializedObject[1]),
            _allWords: Promise.resolve(serializedObject[2]),
            _hourlyData: Promise.resolve(recolorChartData(serializedObject[3])),
            _dailyData: Promise.resolve(recolorChartData(serializedObject[4])),
            _weeklyData: Promise.resolve(recolorChartData(serializedObject[5])),
            _shareOfSpeech: Promise.resolve(
              recolorChartData(serializedObject[6]),
            ),
          });
          this.chat = instance;
        });
    }
  },
};
</script>

<style>
/* Tailwind is not loaded globally (see nuxt.config): the parts of the
   site that opt into it pull it in themselves. */
@import "~/assets/tailwind.css";
</style>
