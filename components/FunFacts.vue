<template>
  <div class="fun-facts">
    <!-- number of words -->

    <div v-for="(date, idx) in data" :key="idx" class="name">
      <h2>
        {{ date.name }}
      </h2>

      <div>
        Number of words: {{ date.numberOfWords }}
        <div>
          <span
            v-for="idx in Math.round(parseInt(date.numberOfWords) / 1000) + 1"
            :key="idx"
            >📘</span
          >
        </div>
      </div>

      <div>
        <h3>Most Used Emojies</h3>
        <span v-for="emojie in date.sortedEmojis" :key="emojie">{{
          emojie
        }}</span>
      </div>

      <div>
        <h3>Longest Message</h3>
        {{ date.longestMessage }}
      </div>

      <div>
        <h3>Unique Words</h3>
        {{ date.uniqueWords }}
      </div>

      <div>
        <h3>Average words per message</h3>
        {{ date.averageMessageLength }}
      </div>
    </div>

    <!-- emojies ranked by frequency -->

    <!-- longest message -->

    <!-- number of unique words -->

    <!-- average words per message -->
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
  mounted() {
    this.data = this.chartdata.getFunFacts();
    console.log(this.data);
  },
  watch: {
    chartdata: function () {
      this.data = this.chartdata.getFunFacts();
    },
  },
};
</script>

<style lang="scss">
.fun-facts {
  padding: 3em;
  font-size: 1.4em;
  color: $c-white;
  background: $c-blue;
  font-weight: bold;
  overflow: hidden;
}

.name {
  float: left;
  margin: 1em;
  padding: 1em;
  border: 2px solid $c-white;
}
</style>
