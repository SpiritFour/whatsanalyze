<template>
  <div v-if="chat" class="text-center py-10">
    <ChatVisualization
      :chat="chat"
      :attachments="attachments"
      :results="this"
    />
    <div class="text-h2 font-weight-bold py-10">Chat Timeline</div>
    <div>Messages per Day</div>
    <Share>
      <ChartsLineChart :chartdata="chat" class="pb-10" />
    </Share>

    <GroupOthers :chat-object="chat" />

    <ChartsTextStats :chat="chat" />

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
    <div v-if="false">
      <ChartsBarChart :chartdata="chat" dataGrouping="hourly" class="py-10" />
      <ChartsBarChart :chartdata="chat" dataGrouping="daily" class="py-10" />
      <ChartsBarChart :chartdata="chat" dataGrouping="weekly" class="py-10" />
    </div>

    <!-- Add workcloud with emojies only  -->
    <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
    <ChartsWordCloud :chartdata="chat" class="pb-10" />
    <DownloadPopup :results="this" :chat="chat" />
  </div>
</template>

<script>
export default {
  props: ["chat", "attachments"],
};
</script>
