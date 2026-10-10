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

    <template v-if="insights.people.length">
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
      </div>
    </template>

    <template v-for="section in sections" :key="section.key">
      <template v-if="section.items.length">
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
        </div>
      </template>
    </template>

    <template v-if="insights.highlights.length">
      <h3 class="report-heading">{{ t("toolsAi.highlightsTitle") }}</h3>
      <ul class="report-card highlights">
        <li v-for="h in insights.highlights" :key="h">{{ h }}</li>
      </ul>
    </template>

    <p class="report-disclaimer">{{ t("toolsAi.reportDisclaimer") }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AiReport } from "~/utils/ai/report";

/**
 * An AI chat report, as the analyzer shows it and as a share link opens it
 * (pages/s.vue): one component, so a friend sees what the sender saw.
 */
const props = defineProps<{ report: AiReport }>();
const { t, locale } = useI18n();

const insights = computed(() => props.report.insights);

const sections = computed(() => [
  {
    key: "dynamics",
    title: "toolsAi.dynamicsTitle",
    items: insights.value.dynamics,
  },
  { key: "topics", title: "toolsAi.topicsTitle", items: insights.value.topics },
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
.report-disclaimer {
  font-size: 0.82rem;
  color: rgba(29, 29, 31, 0.55);
}
</style>
