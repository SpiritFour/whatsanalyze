<template>
  <div>
    <LineChart :chartdata="chat_" />
    <DonughtChart :chartdata="chat_" />
    <BarChart :chartdata="chat_" :hourly="true" />
    <BarChart :chartdata="chat_" :hourly="false" />
    <FunFacts
      :names="['Paul', 'Sebi']"
      :numWords="[100, 20]"
      :emojiesByFreq="[
        ['🙀', '😵', '🤥'],
        ['🙀', '😵', '🤥'],
      ]"
      :longestMessage="[100, 20]"
      :numUniqueWords="[33, 20]"
      :averageWordsPerMessage="[11, 11]"
    />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
