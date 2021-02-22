<template>
  <div>
    <GroupOthers :chat-object="chat_" />
    <LineChart :chartdata="chat_" />
    <DonughtChart :chartdata="chat_" />
    <RadarChart :chartdata="chat_" :hourly="true" />
    <RadarChart :chartdata="chat_" :hourly="false" />
    <BarChart :chartdata="chat_" :hourly="true" />
    <BarChart :chartdata="chat_" :hourly="false" />
    <FunFacts :chartdata="chat_" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
