<template>
  <div class="text-center py-10">
    <GroupOthers :chat-object="chat_" />

    <div class="text-h3 font-weight-bold py-10">Chat Timeline</div>
    <small>Messages per Day </small>
    <Share>
      <ChartsLineChart :chartdata="chat_" class="pb-10" />
    </Share>

    <div class="text-h3 font-weight-bold pt-10">Fun Facts</div>
    <ChartsFunFacts :chartdata="chat_" class="pb-10" />

    <!-- Make dropdown -> messages or words -->
    <div class="text-h3 font-weight-bold py-10">Messages per</div>

    <v-row>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Person</div>
        <ChartsDonughtChart :chartdata="chat_" class="py-10" />
      </v-col>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Month</div>
        <ChartsRadarChart
          :chartdata="chat_"
          dataGrouping="weekly"
          class="py-10"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Time of Day</div>
        <ChartsRadarChart
          :chartdata="chat_"
          dataGrouping="hourly"
          class="py-10"
        />
      </v-col>
      <v-col cols="6">
        <div class="text-h4 font-weight-bold">Weekday</div>
        <ChartsRadarChart
          :chartdata="chat_"
          dataGrouping="daily"
          class="py-10"
        />
      </v-col>
    </v-row>

    <!-- make toggle between radar and normal charts -->
    <div v-show="false">
      <ChartsBarChart :chartdata="chat_" dataGrouping="hourly" class="py-10" />
      <ChartsBarChart :chartdata="chat_" dataGrouping="daily" class="py-10" />
      <ChartsBarChart :chartdata="chat_" dataGrouping="weekly" class="py-10" />
    </div>

    <!-- Remove "weggelassen" und so whatsapp shit -->
    <!-- Add workcloud with emojies only  -->
    <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
    <ChartsWordCloud :chartdata="chat_" class="pb-10" />
  </div>
</template>

<script>
export default {
  props: ["chat_"],
};
</script>
