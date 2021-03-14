<template>
  <div v-if="chat" class="text-center pt-10">
    <ChatVisualization
      :chat="chat"
      :attachments="attachments"
      :results="this"
    />

    <div id="download-graphs">
      <GlobalHeader class="only-visible-to-html2canvas" />
      <div class="text-h2 font-weight-bold py-10">Chat Timeline</div>
      <div>Messages per Day</div>
      <Share id="chat-timeline">
        <ChartsLineChart :chartdata="chat" class="pb-10" />
      </Share>

      <GroupOthers
        :chat-object="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />
      <ChartsTextStats :chat="chat" />

      <Share :use-html2-canvas="true">
        <ChartsFunFacts
          :chartdata="chat"
          class="pb-10"
          data-html2canvas-ignore
          remove-height-in-html2-canvas
        />
      </Share>

      <!-- Make dropdown -> messages or words -->
      <div class="text-h3 font-weight-bold py-10">Messages per</div>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">Person</div>
          <Share id="messages-per-person">
            <ChartsDonughtChart :chartdata="chat" class="py-10" />
          </Share>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">Time of Day</div>
          <Share id="messages-per-time-of-day">
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
          <Share id="radar-month">
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="weekly"
              class="py-10"
            />
          </Share>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="text-h4 font-weight-bold">Weekday</div>
          <Share id="radar-day">
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="daily"
              class="py-10"
            />
          </Share>
        </v-col>
      </v-row>
      <!--  Add workcloud with emojies only  -->
      <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
      <ChartsWordCloud id="wordcloud" :chartdata="chat" class="px-10" />
      <GlobalFooter class="only-visible-to-html2canvas" />
    </div>
    <DownloadPopup :chat="chat" />
  </div>
</template>

<script>
export default {
  props: ["chat", "attachments"],
};
</script>
