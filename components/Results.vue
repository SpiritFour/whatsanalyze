<template>
  <div>
    <GroupOthers :chat-object="chat_" />

    <h1>Messages per day</h1>
    <LineChart :chartdata="chat_" />

    <h1>Messages per person</h1>
    <DonughtChart :chartdata="chat_" />

    <h1>Messages per hour</h1>
    <BarChart :chartdata="chat_" :hourly="true" />
    <h1>Messages per day</h1>

    <BarChart :chartdata="chat_" :hourly="false" />

    <h1>Fun Facts</h1>
    <FunFacts :chartdata="chat_" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
