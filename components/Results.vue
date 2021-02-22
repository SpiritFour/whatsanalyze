<template>
  <div>
    <GroupOthers :chat-object="chat_" />
    <LineChart :chartdata="chat_" />
    <DonughtChart :chartdata="chat_" />
    <RadarChart :chartdata="chat_" dataGrouping="hourly" />
    <RadarChart :chartdata="chat_" dataGrouping="daily" />
    <RadarChart :chartdata="chat_" dataGrouping="weekly" />
    <BarChart :chartdata="chat_" dataGrouping="hourly" />
    <BarChart :chartdata="chat_" dataGrouping="daily" />
    <BarChart :chartdata="chat_" dataGrouping="weekly" />
    <FunFacts :chartdata="chat_" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
