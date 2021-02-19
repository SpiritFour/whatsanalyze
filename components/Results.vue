<template>
  <div>
    <LineChart :chartdata="chat_" />
    <DonughtChart :chartdata="chat_" />
    <BarChart :chartdata="chat_" :hourly="true" />
    <BarChart :chartdata="chat_" :hourly="false" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
