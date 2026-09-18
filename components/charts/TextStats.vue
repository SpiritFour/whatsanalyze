<template>
  <section class="wa-scope grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="rounded-token-lg border border-solid border-[rgba(29,29,31,0.08)] bg-wa-surface-white p-5 text-left shadow-card"
    >
      <p
        class="m-0 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-wa-ink-faint"
      >
        {{ stat.label }}
      </p>
      <p
        class="m-0 mt-2 text-2xl font-bold leading-tight md:text-3xl"
        :class="stat.accent ? 'text-wa-accent' : 'text-wa-ink'"
      >
        {{ stat.value }}
      </p>
      <p v-if="stat.unit" class="m-0 mt-1 text-sm text-wa-ink-faint">
        {{ stat.unit }}
      </p>
    </div>
  </section>
</template>

<script>
import {
  chatDurationInDays,
  firstDate,
  getDateString,
  lastDate,
} from "~/utils/utils";

export default {
  props: ["chat"],
  computed: {
    // Four numbers at the top of the analysis, before any chart: the span of
    // the conversation and its size, which is what people look for first.
    stats() {
      return [
        {
          label: this.$t("firstMessage"),
          value: getDateString(firstDate(this.chat), false, this.$i18n.locale),
        },
        {
          label: this.$t("lastMessage"),
          value: getDateString(lastDate(this.chat), false, this.$i18n.locale),
        },
        {
          label: this.$t("youChatted"),
          value: chatDurationInDays(firstDate(this.chat), lastDate(this.chat)),
          unit: this.$t("days"),
          accent: true,
        },
        {
          // Everyone's messages, not the reader's own — the card used to say
          // "you have sent" over the total for the whole chat.
          label: this.$t("messagesTotal"),
          value: this.chat.filterdChatObject.length.toLocaleString(),
          accent: true,
        },
      ];
    },
  },
};
</script>
