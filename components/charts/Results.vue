<template>
  <div v-if="chat" class="wa-scope">
    <div
      id="download-graphs"
      class="mx-auto flex max-w-[1080px] flex-col gap-6 md:gap-8"
    >
      <!-- Wraps because on a narrow phone the title and the download button
           do not fit on one line, and without this the button is pushed off
           the right edge of the screen. -->
      <div class="flex flex-wrap items-center justify-between gap-4">
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

      <HighlightsSection :chat="chat" :exclude="['overview']" />

      <ChartsCard title="Fun Facts">
        <Share id="fun-facts" title="Fun Facts">
          <!-- No html2canvas-ignore here: the fun facts belong in the
               downloaded summary image like every other card. -->
          <ChartsFunFacts :chartdata="chat" />
        </Share>
      </ChartsCard>

      <!-- Regrouping participants recounts every message, and a shared
           analysis has none to recount. -->
      <GroupOthers
        v-if="!shared"
        :chat-object="chat"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
      />

      <div class="grid gap-6 md:grid-cols-2 md:gap-8">
        <ChartsCard
          :title="$t('person')"
          :subtitle="`${$t('messagesPer')} ${$t('person')}`"
        >
          <Share
            id="messages-per-person"
            :title="`${$t('messagesPer')} ${$t('person')}`"
          >
            <div class="mx-auto max-w-[360px]">
              <ChartsDonughtChart
                :chartdata="chat"
                :center-label="$t('messages')"
              />
            </div>
          </Share>
        </ChartsCard>

        <ChartsCard
          :title="$t('timeOfDay')"
          :subtitle="`${$t('messagesPer')} ${$t('hour')}`"
        >
          <Share
            id="messages-per-time-of-day"
            :title="`${$t('messagesPer')} ${$t('hour')}`"
          >
            <div class="h-[300px]">
              <ChartsBarChart :chartdata="chat" data-grouping="hourly" />
            </div>
          </Share>
        </ChartsCard>
      </div>

      <div class="grid gap-6 md:grid-cols-2 md:gap-8">
        <ChartsCard
          :title="$t('month')"
          :subtitle="`${$t('messagesPer')} ${$t('month')}`"
        >
          <Share
            id="radar-month"
            :title="`${$t('messagesPer')} ${$t('month')}`"
          >
            <div class="mx-auto max-w-[420px]">
              <ChartsRadarChart :chartdata="chat" data-grouping="weekly" />
            </div>
          </Share>
        </ChartsCard>

        <ChartsCard
          :title="$t('weekday')"
          :subtitle="`${$t('messagesPer')} ${$t('weekday')}`"
        >
          <Share
            id="radar-day"
            :title="`${$t('messagesPer')} ${$t('weekday')}`"
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
        :hide-pdf-link="shared"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        :is-valid-subscription="isValidSubscription"
      >
        <!-- Off when this analysis arrived through a link: the reader is
             looking at someone else's results and has no business passing
             them on. -->
        <template v-if="!shared" #secondary>
          <div
            class="border-0 border-t border-solid border-[rgba(29,29,31,0.08)] pt-6"
          >
            <p class="m-0 text-base font-bold text-wa-ink">
              {{ $t("shareLinkCtaTitle") }}
            </p>
            <p class="m-0 mb-5 mt-1 text-sm text-wa-ink-muted">
              {{ $t("shareLinkCtaSubtitle") }}
            </p>
            <ShareLinkButton :chat="chat" />
          </div>
        </template>
      </DownloadPopup>

      <!-- The chat itself and the PDF built from it. A share link carries the
           charts only, so there is nothing here to show. -->
      <ChatVisualization
        v-if="!shared"
        data-html2canvas-ignore
        remove-height-in-html2-canvas
        :chat="chat"
        :attachments="attachments"
        :results="this"
        :is-valid-subscription="isValidSubscription"
      />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    chat: { type: Object, default: null },
    attachments: { type: Array, default: () => [] },
    isValidSubscription: { type: Boolean, default: false },
    /**
     * This analysis came from a share link: charts only, with no messages
     * behind them. Everything that needs the chat itself is left out.
     */
    shared: { type: Boolean, default: false },
  },
};
</script>

<style>
/* Tailwind is not loaded globally (see nuxt.config): the parts of the
   site that opt into it pull it in themselves. */
@import "~/assets/tailwind.css";
</style>
