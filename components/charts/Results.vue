<template>
  <div v-if="chat" class="text-center">
    <div id="download-graphs">
      <GlobalHeader class="only-visible-to-html2canvas" />
      <DownloadPopup
        :chat="chat"
        isSimple
        class="my-5"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        @download-all-individual="downloadAll()"
      />
      <div class="text-h2 font-weight-bold pb-10">Chat Timeline</div>
      <div>Messages per Day</div>
      <Share id="chat-timeline" ref="timeline">
        <ChartsLineChart :chartdata="chat" style="background-color: #ffffff" />
      </Share>
      <DownloadPopup
        :chat="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        @download-all-individual="downloadAll()"
      />
      <Share :use-html2-canvas="true" ref="funFacts">
        <ChartsFunFacts
          :chartdata="chat"
          class="pb-md-10"
          data-html2canvas-ignore
          remove-height-in-html2-canvas
        />
      </Share>

      <ChartsTextStats :chat="chat" />

      <GroupOthers
        :chat-object="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />
      <!-- Make dropdown -> messages or words -->
      <div class="text-h3 font-weight-bold py-10">Messages per</div>
      <v-row>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">Person</div>
          <Share id="messages-per-person" ref="perPerson">
            <ChartsDonughtChart
              :chartdata="chat"
              class="py-10"
              style="background-color: #ffffff"
            />
          </Share>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">Time of Day</div>
          <Share id="messages-per-time-of-day" ref="perTimeOfDay">
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
          <Share id="radar-month" ref="perMonth">
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="weekly"
              class="py-10"
              style="background-color: #ffffff"
            />
          </Share>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="text-h4 font-weight-bold">Weekday</div>
          <Share id="radar-day" ref="perWeekday">
            <ChartsRadarChart
              :chartdata="chat"
              dataGrouping="daily"
              class="py-10"
            />
          </Share>
        </v-col>
      </v-row>

      <div class="text-h3 font-weight-bold pt-10">Word Cloud</div>
      <ChartsWordCloud
        id="wordcloud"
        :chartdata="chat"
        class="px-10"
        style="background-color: #ffffff"
      />

      <DownloadPopup
        :chat="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        @download-all-individual="downloadAll()"
      />

      <ChatVisualization
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        :chat="chat"
        :attachments="attachments"
        :results="this"
      />

      <GlobalFooter class="only-visible-to-html2canvas" />
    </div>
  </div>
</template>

<script>
export default {
  props: ["chat", "attachments"],
  methods: {
    downloadAll() {
      // this.$refs.perWeekday.share();
      // this.$refs.perMonth.share();
      this.$refs.perTimeOfDay.share();
      // this.$refs.perPerson.share();
      // this.$refs.funFacts.share();
      // this.$refs.timeline.share();
    },
  },
};
</script>
