<template>
  <div class="fun-facts">
    <!-- number of words -->

    <div v-for="(person, idx) in data" :key="idx" class="person-facts">
      <div
        class="text-h4 font-weight-bold py-5"
        :style="'color: white; background: ' + person.color"
      >
        {{ person.name }}
      </div>

      <div class="text-left mt-8">
        <div>
          <v-icon :color="person.color">mdi-book</v-icon>

          Number of words: <b>{{ person.numberOfWords }}</b>
        </div>

        <br />

        <!-- TODO: We need a count of how often emojies are used -->
        <div>
          <v-icon :color="person.color"> mdi-emoticon-excited-outline </v-icon>
          Most Used Emojies:
          <span v-for="emojie in person.sortedEmojis" :key="emojie">
            {{ emojie }} {{ emojie.count }}
          </span>
        </div>

        <br />

        <div>
          <v-icon :color="person.color"> mdi-android-messages </v-icon>

          <b>{{ person.longestMessage }}</b> words is the longest message
        </div>

        <br />

        <div>
          <v-icon :color="person.color"> mdi-star </v-icon>

          Used <b>{{ person.uniqueWords }}</b> unique words
        </div>

        <br />

        <div>
          <v-icon :color="person.color"> mdi-android-studio </v-icon>

          On average <b>{{ person.averageMessageLength }}</b> words per message
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      data: [],
    };
  },
  props: ["chartdata"],
  methods: {
    updateGraph() {
      this.chartdata.getFunFacts().then((funFacts) => (this.data = funFacts));
    },
  },
  watch: {
    chartdata: {
      handler() {
        this.updateGraph();
      },
    },
  },
  mounted() {
    this.updateGraph();
  },
};
</script>

<style lang="scss">
.fun-facts {
  overflow: hidden;
}

.person-facts {
  display: inline-block;
  margin: 1em;
  padding: 1em;
  border: 2px solid $c-white;
}
</style>
