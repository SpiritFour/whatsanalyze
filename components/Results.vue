<template>
  <div class="text-center py-10">
    <GroupOthers :chat-object="chat_" />

    <div class="text-h3 font-weight-bold py-10">Chat Timeline</div>
    <small>Messages per Day </small>
    <LineChart :chartdata="chat_" class="pb-10" />

    <div class="text-h3 font-weight-bold pt-10">Fun Facts</div>
    <FunFacts :chartdata="chat_" class="pb-10" />

    <!-- Make dropdown -> messages or words -->
    <div class="text-h3 font-weight-bold py-10">Messages per</div>

    <v-row>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Person</div>
        <DonughtChart :chartdata="chat_" class="py-10" />
      </v-col>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Month</div>
        <RadarChart :chartdata="chat_" dataGrouping="weekly" class="py-10" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Time of Day</div>
        <RadarChart :chartdata="chat_" dataGrouping="hourly" class="py-10" />
      </v-col>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Weekday</div>
        <RadarChart :chartdata="chat_" dataGrouping="daily" class="py-10" />
      </v-col>
    </v-row>

    <!-- make toggle between radar and normal charts -->
    <div v-show="false">
      <BarChart :chartdata="chat_" dataGrouping="hourly" class="py-10" />
      <BarChart :chartdata="chat_" dataGrouping="daily" class="py-10" />
      <BarChart :chartdata="chat_" dataGrouping="weekly" class="py-10" />
    </div>

    <!-- Remove "weggelassen" und so whatsapp shit -->
    <!-- Add workcloud with emojies only  -->
    <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
    <WordCloud :chartdata="chat_" class="pb-10" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
