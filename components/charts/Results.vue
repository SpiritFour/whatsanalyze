<template>
  <div v-if="chat" class="text-center">
    <div id="download-graphs">
      <GlobalHeader
        class="only-visible-to-html2canvas additional-height mb-10"
      />
      <DownloadPopup
        :chat="chat"
        isSimple
        class="my-5"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />
      <div
        class="text-h2 font-weight-bold pb-10"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      >
        Chat Timeline
      </div>
      <div>Messages per Day</div>
      <Share id="chat-timeline">
        <ChartsLineChart :chartdata="chat" />
      </Share>
      <DownloadPopup
        :chat="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />
      <Share :use-html2-canvas="true">
        <ChartsFunFacts
          :chartdata="chat"
          class="pb-md-10"
          data-html2canvas-ignore
          remove-height-in-html2-canvas
        />
      </Share>

      <ChartsTextStats
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        :chat="chat"
      />

      <GroupOthers
        :chat-object="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />
      <!-- Make dropdown -> messages or words -->
      <div
        class="text-h3 font-weight-bold pt-5 py-md-10"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      >
        Messages per
      </div>
      <v-row>
        <v-col cols="12" md="6">
          <div
            class="text-h4 font-weight-bold pb-0 mb-0"
            data-html2canvas-ignore
            remove-height-in-html2-canvas
          >
            Person
          </div>
          <Share id="messages-per-person">
            <ChartsDonughtChart :chartdata="chat" class="pa-0 py-md-10" />
          </Share>
        </v-col>
        <v-col cols="12" md="6">
          <div
            class="text-h4 font-weight-bold"
            data-html2canvas-ignore
            remove-height-in-html2-canvas
          >
            Time of Day
          </div>
          <Share id="messages-per-time-of-day">
            <ChartsBarChart
              :chartdata="chat"
              dataGrouping="hourly"
              class="pa-0 py-md-10"
            />
          </Share>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <div
            class="text-h4 font-weight-bold"
            data-html2canvas-ignore
            remove-height-in-html2-canvas
          >
            Month
          </div>
          <Share id="radar-month">
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="weekly"
              class="pa-0 py-md-10"
            />
          </Share>
        </v-col>
        <v-col cols="12" sm="6">
          <div
            class="text-h4 font-weight-bold"
            data-html2canvas-ignore
            remove-height-in-html2-canvas
          >
            Weekday
          </div>
          <Share id="radar-day">
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="daily"
              class="pa-0 py-md-10"
            />
          </Share>
        </v-col>
      </v-row>

      <div
        class="text-h3 font-weight-bold pt-10"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      >
        Word Cloud
      </div>
      <ChartsWordCloud
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        id="wordcloud"
        :chartdata="chat"
        class="px-2"
      />

      <DownloadPopup
        :chat="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />

      <ChatVisualization
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        :chat="chat"
        :attachments="attachments"
        :results="this"
      />
    </div>
  </div>
</template>

<script>
export default {
  props: ["chat", "attachments"],
};
</script>
