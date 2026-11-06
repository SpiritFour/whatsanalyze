<!--
  The inactivity numbers, read calmly: where the chat stands today, each
  person's average reply time and share of first messages, and the longest
  quiet stretches. A read-only view of analyzeInactivity() for
  /tools/losing-interest; /tools/inactivity keeps its own, fuller report.

  No message text on purpose. The reader came here worried, and a quote from
  the last thing someone wrote is the part most likely to be read into.

  Props
  - analysis (required): what ToolDropzone hands over for tool-type
    "inactivity", or a made-up one for the page's example.
-->
<template>
  <div class="li-result">
    <div class="li-result__now">
      <span class="li-result__label mono-label">
        {{ t("situationLosingInterest.resultNowLabel") }}
      </span>
      <p class="li-result__now-text">
        {{
          t("situationLosingInterest.resultNow", {
            time: ago(analysis.timeSinceLastMs),
            name: analysis.lastMessage.author,
          })
        }}
      </p>
      <p class="li-result__now-status">
        {{ t(`situationLosingInterest.status_${analysis.inactivityStatus}`) }}
      </p>
      <p class="li-result__footnote">
        {{ t("situationLosingInterest.resultNowNote") }}
      </p>
    </div>

    <div class="li-result__block">
      <h3 class="li-result__title">
        {{ t("situationLosingInterest.resultPeopleTitle") }}
      </h3>
      <div class="li-result__people">
        <div v-for="p in people" :key="p.name" class="li-person">
          <span class="li-person__name">{{ p.name }}</span>
          <dl class="li-person__stats">
            <div>
              <dt>{{ t("situationLosingInterest.resultReply") }}</dt>
              <dd>
                {{
                  p.avgResponseTimeMs > 0
                    ? span(p.avgResponseTimeMs)
                    : t("situationLosingInterest.resultReplyNone")
                }}
              </dd>
            </div>
            <div>
              <dt>{{ t("situationLosingInterest.resultStarted") }}</dt>
              <dd>{{ p.conversationStartersPct }}%</dd>
            </div>
            <div>
              <dt>{{ t("situationLosingInterest.resultMessages") }}</dt>
              <dd>{{ p.messageCount.toLocaleString(locale) }}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p v-if="hiddenPeople > 0" class="li-result__footnote">
        {{
          t("situationLosingInterest.resultMorePeople", { count: hiddenPeople })
        }}
      </p>
      <p class="li-result__footnote">
        {{ t("situationLosingInterest.resultPeopleNote") }}
      </p>
    </div>

    <div v-if="analysis.longestGaps.length" class="li-result__block">
      <h3 class="li-result__title">
        {{ t("situationLosingInterest.resultGapsTitle") }}
      </h3>
      <ol class="li-result__gaps">
        <li v-for="(gap, i) in analysis.longestGaps" :key="i" class="li-gap">
          <span class="li-gap__duration">{{ span(gap.durationMs) }}</span>
          <span class="li-gap__dates mono-label">
            {{ date(gap.startDate) }} → {{ date(gap.endDate) }}
          </span>
          <span class="li-gap__ended">
            {{
              t("situationLosingInterest.resultGapEnded", {
                name: gap.brokenBy,
              })
            }}
          </span>
        </li>
      </ol>
    </div>

    <p class="li-result__span">
      {{
        t("situationLosingInterest.resultSpan", {
          count: analysis.totalMessages.toLocaleString(locale),
          days: analysis.dateRange.totalDays.toLocaleString(locale),
        })
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ChatInactivityAnalysis } from "~/composables/useChatTool";

const props = defineProps<{ analysis: ChatInactivityAnalysis }>();

const { t, locale } = useI18n();

/** A group chat lists its most active members, not everyone. */
const MAX_PEOPLE = 6;
const people = computed(() => props.analysis.participants.slice(0, MAX_PEOPLE));
const hiddenPeople = computed(
  () => props.analysis.participants.length - people.value.length,
);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "4 days 3 hours", "1 hour 50 minutes", in the page's language. The tool's
 * own formatDuration() writes "4d 3h", which reads as English everywhere.
 */
function span(ms: number): string {
  const unit = (name: string, value: number) =>
    new Intl.NumberFormat(locale.value, {
      style: "unit",
      unit: name,
      unitDisplay: "long",
    }).format(value);
  const parts: string[] = [];
  if (ms >= DAY) {
    parts.push(unit("day", Math.floor(ms / DAY)));
    const hours = Math.floor((ms % DAY) / HOUR);
    if (hours) parts.push(unit("hour", hours));
  } else if (ms >= HOUR) {
    parts.push(unit("hour", Math.floor(ms / HOUR)));
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    if (minutes) parts.push(unit("minute", minutes));
  } else if (ms >= MINUTE) {
    parts.push(unit("minute", Math.floor(ms / MINUTE)));
  } else {
    parts.push(unit("second", Math.max(1, Math.floor(ms / 1000))));
  }
  return new Intl.ListFormat(locale.value, {
    type: "unit",
    style: "narrow",
  }).format(parts);
}

/** "3 days ago", from how long ago it was rather than from today's date. */
function ago(ms: number): string {
  const format = new Intl.RelativeTimeFormat(locale.value, {
    numeric: "always",
  });
  if (ms < HOUR)
    return format.format(-Math.max(1, Math.floor(ms / MINUTE)), "minute");
  if (ms < DAY) return format.format(-Math.floor(ms / HOUR), "hour");
  if (ms < 60 * DAY) return format.format(-Math.floor(ms / DAY), "day");
  if (ms < 365 * DAY)
    return format.format(-Math.floor(ms / (30 * DAY)), "month");
  return format.format(-Math.floor(ms / (365 * DAY)), "year");
}

function date(d: Date): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
</script>

<style lang="scss" scoped>
.li-result {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  text-align: left;
  color: $wa-ink;
}

.li-result__now,
.li-result__block {
  background: $wa-surface-white;
  border-radius: $wa-radius-xl;
  padding: clamp(1.4rem, 3.5vw, 2rem);
  box-shadow: $wa-shadow-sm;
  min-width: 0;
}

.li-result__label {
  display: block;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $wa-ink-faint;
  margin-bottom: 0.5rem;
}

.li-result__now-text {
  font-size: clamp(1.2rem, 2.6vw, 1.5rem);
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  overflow-wrap: anywhere;
}

.li-result__now-status {
  margin: 0.5rem 0 0;
  color: $wa-ink-muted;
  line-height: 1.5;
}

.li-result__title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.li-result__people {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.8rem;
}

.li-person {
  background: $wa-surface-light;
  border-radius: $wa-radius-lg;
  padding: 1.1rem 1.2rem;
  min-width: 0;
}

.li-person__name {
  display: block;
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 0.6rem;
  overflow-wrap: anywhere;
}

.li-person__stats {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0;

  div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.8rem;
  }

  dt {
    font-size: 0.85rem;
    color: $wa-ink-muted;
  }

  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

.li-result__gaps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.li-gap {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  background: $wa-surface-light;
  border-radius: $wa-radius-md;
  padding: 0.9rem 1.1rem;
  min-width: 0;
}

.li-gap__duration {
  font-weight: 700;
}

.li-gap__dates {
  font-size: 0.78rem;
  color: $wa-ink-faint;
}

.li-gap__ended {
  font-size: 0.9rem;
  color: $wa-ink-muted;
  overflow-wrap: anywhere;
}

.li-result__footnote {
  margin: 0.9rem 0 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: $wa-ink-muted;
}

.li-result__span {
  margin: 0;
  font-size: 0.85rem;
  color: $wa-ink-muted;
  text-align: center;
}
</style>
