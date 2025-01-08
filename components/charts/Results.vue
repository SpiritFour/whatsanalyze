<template>
  <div v-if="chat" class="text-center">
    <div id="download-graphs">
      <GlobalHeader class="only-visible-to-html2canvas" />
      <DownloadPopup
        :chat="chat"
        is-simple
        class="my-5"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />
      <div class="text-h2 font-weight-bold pb-10">{{ $t("chatTimeline") }}</div>
      <div>{{ $t("messagesPerDay") }}</div>
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

      <ChartsTextStats :chat="chat" />

      <GroupOthers
        :chat-object="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />
      <!-- Make dropdown -> messages or words -->
      <div class="text-h3 font-weight-bold py-10">{{ $t("messagesPer") }}</div>
      <v-row>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">{{ $t("person") }}</div>
          <Share id="messages-per-person">
            <ChartsDonughtChart :chartdata="chat" class="py-10" />
          </Share>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-h4 font-weight-bold">{{ $t("timeOfDay") }}</div>
          <Share id="messages-per-time-of-day">
            <ChartsBarChart
              :chartdata="chat"
              data-grouping="hourly"
              class="py-10"
            />
          </Share>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <div class="text-h4 font-weight-bold">{{ $t("month") }}</div>
          <Share id="radar-month">
            <ChartsRadarChart
              :chartdata="chat"
              data-grouping="weekly"
              class="py-10"
            />
          </Share>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="text-h4 font-weight-bold">{{ $t("weekday") }}</div>
          <Share id="radar-day">
            <ChartsRadarChart
              :chartdata="chat"
              data-grouping="daily"
              class="py-10"
            />
          </Share>
        </v-col>
      </v-row>

      <div class="text-h3 font-weight-bold pt-10">{{ $t("wordCloud") }}</div>
      <ChartsWordCloud id="wordcloud" :chartdata="chat" class="px-10" />

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
        :isValidSubscription="isValidSubscription"
      />

      <GlobalFooter class="only-visible-to-html2canvas" />
    </div>
  </div>
</template>

<script>
export default {
  props: ["chat", "attachments", "isValidSubscription"]
};
</script>
