<template>
  <div class="fun-facts">
    <!-- number of words -->

    <div v-for="(person, idx) in data" :key="idx" class="person-facts">
      <div
        :style="'color: white; background: ' + person.color"
        class="text-h4 font-weight-bold py-5"
      >
        {{ person.name }}
      </div>

      <div class="text-left mt-8">
        <div>
          <i :color="person.color">mdi-book</i>

          {{ $t("totalWords") }} <b>{{ person.numberOfWords }}</b>
        </div>

        <br />

        <!-- TODO: We need a count of how often emojies are used -->
        <div>
          <i :color="person.color"> mdi-emoticon-excited-outline </i>
          {{ $t("mostUsedEmojie") }}
          <span v-for="emojie in person.sortedEmojis" :key="emojie">
            {{ emojie }} {{ emojie.count }}
          </span>
        </div>

        <br />

        <div>
          <i :color="person.color"> mdi-android-messages </i>
          {{ $t("longestMessage") }}
          <b>{{ person.longestMessage }}</b> words
        </div>

        <br />

        <div>
          <i :color="person.color"> mdi-star </i>
          {{ $t("uniqueWords") }}
          <b>{{ person.uniqueWords }}</b>
        </div>

        <br />

        <div>
          <i :color="person.color"> mdi-android-studio </i>
          {{ $t("avgWords") }}
          <b>{{ person.averageMessageLength }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      data: []
    };
  },
  props: ["chartdata"],
  methods: {
    updateGraph() {
      this.chartdata.getFunFacts().then((funFacts) => (this.data = funFacts));
    }
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
    this.updateGraph();
  }
};
</script>

<style>
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
