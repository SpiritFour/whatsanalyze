<template>
  <div class="text-center py-10">
    <ChatVisualization :chat="chat" />

    <GroupOthers :chat-object="chat" />

    <div class="text-h3 font-weight-bold pt-10">Fun Facts</div>
    <ChartsFunFacts :chartdata="chat" class="pb-10" />

    <!-- Make dropdown -> messages or words -->
    <div class="text-h3 font-weight-bold py-10">Messages per</div>

    <v-row>
      <v-col cols="12" md="6">
        <div class="text-h4 font-weight-bold">Person</div>
        <Share>
          <ChartsDonughtChart :chartdata="chat" class="py-10" />
        </Share>
      </v-col>
      <v-col cols="12" md="6">
        <div class="text-h4 font-weight-bold">Time of Day</div>
        <Share>
          <ChartsBarChart
            :chartdata="chat"
            dataGrouping="hourly"
            class="py-10"
          />
        </Share>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="6">
        <div class="text-h4 font-weight-bold">Month</div>
        <Share>
          <ChartsRadarChart
            :chartdata="chat"
            dataGrouping="weekly"
            class="py-10"
          />
        </Share>
      </v-col>
      <v-col cols="12" sm="6">
        <div class="text-h4 font-weight-bold">Weekday</div>
        <Share>
          <ChartsRadarChart
            :chartdata="chat"
            dataGrouping="daily"
            class="py-10"
          />
        </Share>
      </v-col>
    </v-row>

    <!-- make toggle between radar and normal charts -->
    <div v-show="false">
      <ChartsBarChart :chartdata="chat" dataGrouping="hourly" class="py-10" />
      <ChartsBarChart :chartdata="chat" dataGrouping="daily" class="py-10" />
      <ChartsBarChart :chartdata="chat" dataGrouping="weekly" class="py-10" />
    </div>

    <!-- Remove "weggelassen" und so whatsapp shit -->
    <!-- Add workcloud with emojies only  -->
    <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
    <ChartsWordCloud :chartdata="chat" class="pb-10" />

    <div class="text-h3 font-weight-bold py-10">Chat Timeline</div>
    <small>Messages per Day </small>
    <Share>
      <ChartsAreaLineChart :chartdata="chat" class="pb-10" />
    </Share>
  </div>
</template>

<script>
export default {
  props: ["chat"],
};
</script>
