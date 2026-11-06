<!--
  Who starts the conversations in a chat, and how fast each person replies,
  side by side for every person. The two numbers sit together on purpose:
  starting fewer conversations but answering within minutes is effort too,
  and the share of starts shown alone would read as a verdict.

  Read-only, and nothing here computes anything: the numbers are
  analyzeInactivity's (utils/inactivity.js), passed in per person, so the
  page's example can show made-up people through the same view.

  Props
  - people (required): [{ name, startsCount, startsPct, avgReplyMs,
    sinceLastMs, messageCount }], in the order to show them.
  - totalStarts (required): every conversation start in the chat.
  - max: how many people to show; the rest are counted underneath.
-->
<template>
  <div class="texting-first">
    <ul class="texting-first__people">
      <li
        v-for="person in shown"
        :key="person.name"
        class="texting-first__card"
      >
        <div class="texting-first__head">
          <span class="texting-first__avatar" aria-hidden="true">
            {{ person.name.charAt(0) }}
          </span>
          <strong class="texting-first__name">{{ person.name }}</strong>
        </div>

        <div class="texting-first__starts">
          <span class="texting-first__pct">
            {{ percent(person.startsPct) }}
          </span>
          <span class="texting-first__label">
            {{ t("situationTextingFirst.numbersStarted") }}
          </span>
        </div>
        <div
          class="texting-first__bar"
          aria-hidden="true"
          :style="{ '--share': `${Math.min(100, person.startsPct)}%` }"
        ></div>
        <p class="texting-first__count mono-label">
          {{
            t("situationTextingFirst.numbersStartedOf", {
              count: number(person.startsCount),
              total: number(totalStarts),
            })
          }}
        </p>

        <dl class="texting-first__facts">
          <div class="texting-first__fact">
            <dt>
              <v-icon size="16">mdi-clock-fast</v-icon>
              {{ t("situationTextingFirst.numbersReply") }}
            </dt>
            <dd>
              {{
                person.avgReplyMs > 0
                  ? replyTime(person.avgReplyMs)
                  : t("situationTextingFirst.numbersNoReplies")
              }}
            </dd>
          </div>
          <div class="texting-first__fact">
            <dt>
              <v-icon size="16">mdi-clock-time-four-outline</v-icon>
              {{ t("situationTextingFirst.numbersLast") }}
            </dt>
            <dd>{{ ago(person.sinceLastMs) }}</dd>
          </div>
          <div class="texting-first__fact">
            <dt>
              <v-icon size="16">mdi-message-text-outline</v-icon>
              {{ t("situationTextingFirst.numbersMessages") }}
            </dt>
            <dd>{{ number(person.messageCount) }}</dd>
          </div>
        </dl>
      </li>
    </ul>
    <p v-if="hidden > 0" class="texting-first__more">
      {{
        t("situationTextingFirst.numbersMore", {
          count: number(hidden),
        })
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface TextingFirstPerson {
  name: string;
  startsCount: number;
  startsPct: number;
  /** 0 when this person never answered anyone within a day. */
  avgReplyMs: number;
  sinceLastMs: number;
  messageCount: number;
}

const props = withDefaults(
  defineProps<{
    people: TextingFirstPerson[];
    totalStarts: number;
    max?: number;
  }>(),
  { max: 6 },
);

const { t, locale } = useI18n();

const shown = computed(() => props.people.slice(0, props.max));
const hidden = computed(() => props.people.length - shown.value.length);

const number = (value: number) => value.toLocaleString(locale.value);

const percent = (value: number) =>
  new Intl.NumberFormat(locale.value, { style: "percent" }).format(value / 100);

const unit = (value: number, name: "minute" | "hour") =>
  new Intl.NumberFormat(locale.value, {
    style: "unit",
    unit: name,
    unitDisplay: "short",
  }).format(value);

/**
 * In the page's language. utils/inactivity.js formats durations too, but
 * only in English ("2h 5m"). A reply only counts within a day, so hours and
 * minutes cover every average.
 */
function replyTime(ms: number) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return `< ${unit(1, "minute")}`;
  if (minutes < 60) return unit(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest
    ? `${unit(hours, "hour")} ${unit(rest, "minute")}`
    : unit(hours, "hour");
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(ms: number) {
  const relative = new Intl.RelativeTimeFormat(locale.value, {
    numeric: "auto",
  });
  if (ms < HOUR) return relative.format(-Math.floor(ms / MINUTE), "minute");
  if (ms < DAY) return relative.format(-Math.floor(ms / HOUR), "hour");
  if (ms < 30 * DAY) return relative.format(-Math.floor(ms / DAY), "day");
  if (ms < 365 * DAY) {
    return relative.format(-Math.floor(ms / (30.4375 * DAY)), "month");
  }
  return relative.format(-Math.floor(ms / (365.25 * DAY)), "year");
}
</script>

<style lang="scss" scoped>
.texting-first__people {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.2rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.texting-first__card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(1.4rem, 3vw, 1.8rem);
  border-radius: $wa-radius-xl;
  background: $wa-surface-white;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
  color: $wa-ink;
  text-align: left;
}

.texting-first__head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  margin-bottom: 1.2rem;
}

.texting-first__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: $wa-accent-soft;
  color: $wa-accent-dark;
  font-weight: 700;
}

.texting-first__name {
  min-width: 0;
  font-size: 1.1rem;
  overflow-wrap: anywhere;
}

.texting-first__starts {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.2rem 0.5rem;
}

.texting-first__pct {
  font-size: clamp(2rem, 5vw, 2.6rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.texting-first__label {
  color: $wa-ink-muted;
  font-size: 0.95rem;
}

.texting-first__bar {
  position: relative;
  height: 8px;
  margin: 0.9rem 0 0.5rem;
  border-radius: $wa-radius-pill;
  background: $wa-surface-light;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: var(--share, 0%);
    border-radius: inherit;
    background: $wa-accent;
  }
}

.texting-first__count {
  margin: 0 0 1.2rem;
  color: $wa-ink-faint;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}

.texting-first__facts {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: auto 0 0;
  padding-top: 1rem;
  border-top: 1px solid $wa-border;
}

.texting-first__fact {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;

  dt {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: $wa-ink-muted;
    font-size: 0.9rem;
  }

  dd {
    margin: 0;
    font-weight: 700;
    text-align: right;
  }
}

.texting-first__more {
  margin-top: 1rem;
  color: $wa-ink-muted;
  font-size: 0.9rem;
}
</style>
