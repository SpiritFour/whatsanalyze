<template>
  <div>
    <GroupOthers :chat-object="chat_" />

    <h1>Messages per day</h1>
    <LineChart :chartdata="chat_" />

    <h1>Messages per person</h1>
    <DonughtChart :chartdata="chat_" />
    <RadarChart :chartdata="chat_" dataGrouping="hourly" />
    <RadarChart :chartdata="chat_" dataGrouping="daily" />
    <RadarChart :chartdata="chat_" dataGrouping="weekly" />
    <BarChart :chartdata="chat_" dataGrouping="hourly" />
    <BarChart :chartdata="chat_" dataGrouping="daily" />
    <BarChart :chartdata="chat_" dataGrouping="weekly" />
    <WordCloud :chartdata="chat_" />
    <FunFacts :chartdata="chat_" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
