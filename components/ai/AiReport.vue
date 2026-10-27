<template>
  <div class="report">
    <div v-if="insights.answer" class="report-card report-answer">
      <span v-if="report.question" class="mono-label report-answer__q">
        {{ report.question }}
      </span>
      <p>{{ insights.answer }}</p>
    </div>

    <div class="report-card report-summary">
      <span v-if="insights.vibe" class="vibe-pill">
        <v-icon size="16">mdi-creation-outline</v-icon>
        {{ insights.vibe }}
      </span>
      <p>{{ insights.summary }}</p>
      <p v-if="coverageText" class="report-coverage mono-label">
        {{ coverageText }}
      </p>
    </div>

    <template v-if="insights.people.length || locked.people">
      <h3 class="report-heading">{{ t("toolsAi.peopleTitle") }}</h3>
      <div class="report-grid">
        <div v-for="p in insights.people" :key="p.name" class="report-card">
          <div class="person-head">
            <span class="avatar-circle">{{ p.name.charAt(0) }}</span>
            <div>
              <strong>{{ p.name }}</strong>
              <span class="mono-label person-role">{{ p.role }}</span>
            </div>
          </div>
          <p>{{ p.style }}</p>
        </div>
        <NuxtLink
          v-for="n in locked.people"
          :key="`locked-${n}`"
          v-bind="lockedLink"
        >
          <div class="person-head" aria-hidden="true">
            <span class="avatar-circle">?</span>
            <strong>{{ FILLER_TITLE }}</strong>
          </div>
          <p aria-hidden="true">{{ FILLER_TEXT }}</p>
          <v-icon class="report-locked__icon">mdi-lock-outline</v-icon>
        </NuxtLink>
      </div>
    </template>

    <template v-for="section in sections" :key="section.key">
      <template v-if="section.items.length || locked[section.key]">
        <h3 class="report-heading">{{ t(section.title) }}</h3>
        <div class="report-grid">
          <div
            v-for="item in section.items"
            :key="item.title"
            class="report-card"
          >
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </div>
          <NuxtLink
            v-for="n in locked[section.key]"
            :key="`locked-${n}`"
            v-bind="lockedLink"
          >
            <strong aria-hidden="true">{{ FILLER_TITLE }}</strong>
            <p aria-hidden="true">{{ FILLER_TEXT }}</p>
            <v-icon class="report-locked__icon">mdi-lock-outline</v-icon>
          </NuxtLink>
        </div>
      </template>
    </template>

    <template v-if="insights.highlights.length || locked.highlights">
      <h3 class="report-heading">{{ t("toolsAi.highlightsTitle") }}</h3>
      <ul v-if="insights.highlights.length" class="report-card highlights">
        <li v-for="h in insights.highlights" :key="h">{{ h }}</li>
      </ul>
      <NuxtLink v-if="locked.highlights" v-bind="lockedLink">
        <ul class="highlights" aria-hidden="true">
          <li v-for="n in locked.highlights" :key="n">{{ FILLER_TITLE }}</li>
        </ul>
        <v-icon class="report-locked__icon">mdi-lock-outline</v-icon>
      </NuxtLink>
    </template>

    <!-- A free preview: what the full report adds, and how to get it -->
    <div v-if="report.locked" class="report-card report-locked">
      <v-icon size="28" color="#818cf8">mdi-lock-outline</v-icon>
      <strong>{{ t("toolsAi.lockedTitle") }}</strong>
      <LandingButton
        :to="subscribeLink"
        @click="analyticsTools.ctaClick('ai', 'subscribe')"
      >
        {{ t("toolsAi.lockedButton") }}
      </LandingButton>
    </div>

    <p class="report-disclaimer">{{ t("toolsAi.reportDisclaimer") }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AiReport } from "~/utils/ai/report";
import { analyticsTools } from "~/composables/useAnalytics";

/**
 * An AI chat report, as the analyzer shows it and as a share link opens it
 * (pages/s.vue): one component, so a friend sees what the sender saw.
 */
const props = defineProps<{ report: AiReport }>();
const { t, locale } = useI18n();
const subscribeLink = useSubscribeLink();

/** What the free preview left out: that many blurred cards per section. */
const locked = computed(
  () =>
    props.report.locked ?? { people: 0, dynamics: 0, topics: 0, highlights: 0 },
);
// Blurred stand-ins: the real text never reaches a preview's browser.
const FILLER_TITLE = "Something only the full report shows";
const FILLER_TEXT =
  "A closer look at this chat, with the moments that show it and what it says about the two of you.";
const lockedLink = computed(() => ({
  to: subscribeLink.value,
  class: "report-card report-card--locked",
  "aria-label": t("toolsAi.lockedButton"),
  onClick: () => analyticsTools.ctaClick("ai", "subscribe"),
}));

const insights = computed(() => props.report.insights);

const sections = computed(() => [
  {
    key: "dynamics" as const,
    title: "toolsAi.dynamicsTitle",
    items: insights.value.dynamics,
  },
  {
    key: "topics" as const,
    title: "toolsAi.topicsTitle",
    items: insights.value.topics,
  },
]);

/** What the report is based on, counted by the page rather than the model. */
const coverageText = computed(() => {
  const c = props.report.coverage;
  if (!c) return "";
  const n = (v: number) => v.toLocaleString(locale.value);
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale.value, {
      month: "short",
      year: "numeric",
    });
  return t(
    c.parts > 1 ? "toolsAi.reportCoverageParts" : "toolsAi.reportCoverage",
    {
      total: n(c.total),
      from: date(c.from),
      to: date(c.to),
      read: n(Math.min(c.read, c.total)),
      parts: c.parts,
    },
  );
});
</script>

<style scoped lang="scss">
.report {
  text-align: left;
  display: grid;
  gap: 1rem;
}
.report-heading {
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1d1d1f;
}
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1rem;
}
.report-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.2rem 1.4rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  min-width: 0;
  overflow-wrap: anywhere;

  p {
    margin-top: 0.4rem;
    line-height: 1.5;
  }
}
.report-answer {
  border: 2px solid rgba(33, 166, 141, 0.45);

  &__q {
    font-size: 0.78rem;
    color: #157a67;
  }

  p {
    font-size: 1.05rem;
  }
}
.report-coverage {
  font-size: 0.78rem !important;
  color: rgba(29, 29, 31, 0.55);
}
.report-summary p {
  font-size: 1.1rem;
}
.vibe-pill {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  background: rgba(33, 166, 141, 0.12);
  color: #157a67;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 100px;
}
.person-head {
  display: flex;
  gap: 0.7rem;
  align-items: center;

  strong {
    display: block;
  }
}
.person-role {
  font-size: 0.72rem;
  color: rgba(29, 29, 31, 0.55);
}
.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #21a68d;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
.highlights {
  padding-left: 2.4rem;
  display: grid;
  gap: 0.5rem;
}
.report-locked {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  text-align: center;
  border: 2px dashed rgba(129, 140, 248, 0.5);
}
.report-card--locked {
  position: relative;
  display: block;
  text-decoration: none;
  cursor: pointer;

  > :not(.report-locked__icon) {
    filter: blur(5px);
    user-select: none;
  }
}
.report-locked__icon {
  position: absolute !important;
  inset: 0;
  margin: auto;
  color: #818cf8 !important;
}
.report-disclaimer {
  font-size: 0.82rem;
  color: rgba(29, 29, 31, 0.55);
}
</style>
