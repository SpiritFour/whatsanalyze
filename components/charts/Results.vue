<template>
  <div v-if="chat" class="wa-scope">
    <div
      id="download-graphs"
      class="mx-auto flex max-w-[1080px] flex-col gap-6 md:gap-8"
    >
      <div class="flex justify-between">
        <SiteHeader :sticky="false" class="only-visible-to-html2canvas" />

        <div class="text-4xl font-bold">
          {{ $t("homeLanding.resultsTitle") }}
        </div>

        <DownloadPopup
          :chat="chat"
          is-simple
          data-html2canvas-ignore
          remove-height-in-html2-canvas
        />
      </div>

      <ChartsCard :title="$t('chatTimeline')" :subtitle="$t('messagesPerDay')">
        <Share
          id="chat-timeline"
          :title="$t('messagesPerDay')"
          :subtitle="$t('chatTimeline')"
        >
          <div class="h-[280px] md:h-[360px]">
            <ChartsLineChart :chartdata="chat" />
          </div>
        </Share>
      </ChartsCard>

      <ChartsTextStats :chat="chat" />

      <ChartsCard title="Fun Facts">
        <Share id="fun-facts" title="Fun Facts">
          <ChartsFunFacts
            :chartdata="chat"
            data-html2canvas-ignore
            remove-height-in-html2-canvas
          />
        </Share>
      </ChartsCard>

      <GroupOthers
        :chat-object="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />

      <div class="grid gap-6 md:grid-cols-2 md:gap-8">
        <ChartsCard :title="$t('person')" :subtitle="$t('messagesPer')">
          <Share
            id="messages-per-person"
            :title="$t('messagesPer') + ' - ' + $t('person')"
          >
            <div class="mx-auto max-w-[360px]">
              <ChartsDonughtChart
                :chartdata="chat"
                :center-label="$t('messages')"
              />
            </div>
          </Share>
        </ChartsCard>

        <ChartsCard :title="$t('timeOfDay')" :subtitle="$t('messagesPer')">
          <Share
            id="messages-per-time-of-day"
            :title="$t('messagesPer') + ' - ' + $t('timeOfDay')"
          >
            <div class="h-[300px]">
              <ChartsBarChart :chartdata="chat" data-grouping="hourly" />
            </div>
          </Share>
        </ChartsCard>
      </div>

      <div class="grid gap-6 md:grid-cols-2 md:gap-8">
        <ChartsCard :title="$t('month')" :subtitle="$t('messagesPer')">
          <Share
            id="radar-month"
            :title="$t('messagesPer') + ' - ' + $t('month')"
          >
            <div class="mx-auto max-w-[420px]">
              <ChartsRadarChart :chartdata="chat" data-grouping="weekly" />
            </div>
          </Share>
        </ChartsCard>

        <ChartsCard :title="$t('weekday')" :subtitle="$t('messagesPer')">
          <Share
            id="radar-day"
            :title="$t('messagesPer') + ' - ' + $t('weekday')"
          >
            <div class="mx-auto max-w-[420px]">
              <ChartsRadarChart :chartdata="chat" data-grouping="daily" />
            </div>
          </Share>
        </ChartsCard>
      </div>

      <ChartsCard :title="$t('wordCloud')">
        <Share id="wordcloud" :title="$t('wordCloud')">
          <ChartsWordCloud :chartdata="chat" class="h-[320px]" />
        </Share>
      </ChartsCard>

      <ChartsCard title="Emojis">
        <Share id="emojicloud" title="Emojis">
          <ChartsEmojiCloud :chartdata="chat" class="h-[260px]" />
        </Share>
      </ChartsCard>

      <DownloadPopup
        :chat="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        :is-valid-subscription="isValidSubscription"
      />

      <ChatVisualization
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        :chat="chat"
        :attachments="attachments"
        :results="this"
        :is-valid-subscription="isValidSubscription"
      />

      <SiteFooter class="only-visible-to-html2canvas" />
    </div>
  </div>
</template>

<script>
export default {
  props: ["chat", "attachments", "isValidSubscription"],
};
</script>
