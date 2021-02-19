<template>
  <div class="fun-facts">
    <!-- number of words -->

    <div v-for="(name, idx) in names" :key="idx" class="name">
      <h2>
        {{ name }}
      </h2>

      <div>
        Number of words: {{ numWords[idx] }}
        <div>
          <span
            v-for="idx in Math.round(parseInt(numWords[idx]) / 50) + 1"
            :key="idx"
            >📘</span
          >
        </div>
      </div>

      <div>
        <h3>Most Used Emojies</h3>
        <span v-for="emojie in emojiesByFreq[idx]" :key="emojie">{{
          emojie
        }}</span>
      </div>

      <div>
        <h3>Longest Message</h3>
        {{ longestMessage[idx] }}
      </div>

      <div>
        <h3>Unique Words</h3>
        {{ numUniqueWords[idx] }}
      </div>

      <div>
        <h3>Average words per message</h3>
        {{ averageWordsPerMessage[idx] }}
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
  props: [
    "names",
    "numWords",
    "emojiesByFreq",
    "longestMessage",
    "numUniqueWords",
    "averageWordsPerMessage",
  ],
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
