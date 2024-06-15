<template>
  <div>
    <div ref="chartdiv"></div>
    <v-row data-html2canvas-ignore
           remove-height-in-html2-canvas>
      <v-text-field
        v-model="additionalExcludes"
        :label='$t("excludeWords")'
        :hint='$t("excludeWordsHint")'
        clearable
        @keydown.enter.prevent="updateGraph"
        @click:clear="updateGraph"
      ></v-text-field>
      <v-btn class="btn-color"
             dark
             @click="updateGraph">
        <v-icon>mdi-arrow-right</v-icon>
      </v-btn>
    </v-row>

  </div>
</template>

<script>
import { Chat } from "~/functions/transformChatData";

import stopwords from "stopwords-de";

export default {
  name: "WordCloud",
  props: {
    chartdata: new Chat(),
    minWordLength: {
      type: Number,
      default: 3
    },
    minFontSize: {
      type: Number,
      default: 6
    },
    randomness: {
      type: Number,
      default: 0.1
    },
    stopWords: {
      type: Array,
      default: () => stopwords
    }
  },
  data() {
    return {
      chart: null,
      series: null,
      additionalExcludes: ""
    };
  },
  watch: {
    chartdata: {
      handler() {
        this.updateGraph();
      },
      deep: true
    }
  },
  mounted() {
    let { am4core, am4themes_animated, am4plugins_wordCloud } = this.$am4core();
    am4core.useTheme(am4themes_animated);
    am4core.options.onlyShowOnViewport = true;

    this.chart = am4core.create(
      this.$refs.chartdiv,
      am4plugins_wordCloud.WordCloud
    );
    this.series = this.chart.series.push(
      new am4plugins_wordCloud.WordCloudSeries()
    );
    this.series.dataFields.word = "word";
    this.series.dataFields.value = "freq";
    this.series.labels.template.tooltipText = "[bold]{freq}[/] x {word}";
    this.series.accuracy = 5;
    this.updateGraph();
  },
  beforeDestroy: function() {
    this.chart.dispose();
  },
  methods: {
    async updateGraph() {
      // this is a list of [{word: String, freq: String}, ...]
      const allWords = await this.chartdata.getAllWords();

      if(!this.additionalExcludes){
        this.series.data = allWords
        return
      }

      const regex = this.buildRegex()

      //remove everything from all words, that matches
      this.series.data = allWords.filter(item => !regex.test(item.word));
    },
    buildRegex() {
      // Regex to detect if a string contains regex metacharacters
      const regexMetaChars = /[.*+?^${}()|[\]\\]/;

      function isValidRegex(pattern) {
        if( regexMetaChars.test(pattern)) {
          try {
            new RegExp(pattern);
            return true;
          } catch (e) {
            return false;
          }
        }
        else{
          return false
        }
      }

      // Function to escape regex special characters if the string is intended to be a literal
      function escapeRegexCharacters(string) {
        // Escape only if the string does not contain regex metacharacters
        // otherwise it needs to be an exact match
        return isValidRegex(string) ? string : `^${string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;
      }

      // Filter out empty strings and escape regex special characters if needed
      const regexParts = this.additionalExcludes.split(" ").filter(s => s !== '').map(escapeRegexCharacters);

      // Join the parts to create a single regex pattern
      const regexPattern = regexParts.join('|');
      return new RegExp(regexPattern);
    }
  }
};
</script>

<style scoped></style>
