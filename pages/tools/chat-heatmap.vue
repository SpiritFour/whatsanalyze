<template>
  <div class="landing-page">
    <LandingHero
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('toolsChatHeatmap.heroEyebrow')"
      :title="t('toolsChatHeatmap.heroTitle')"
      :subtitle="t('toolsChatHeatmap.heroSubtitle')"
      :note="t('toolsChatHeatmap.heroNote')"
    >
      <div id="dropzone-slot">
        <ToolDropzone
          tool-type="heatmap"
          @analyzed="onChatAnalyzed"
          @reset="onReset"
        />
      </div>
    </LandingHero>

    <!-- Results Section (Visible when chat is parsed) -->
    <LandingSection
      v-if="analysis"
      theme="light"
      :eyebrow="t('toolsChatHeatmap.reportEyebrow')"
      :title="t('toolsChatHeatmap.reportTitle')"
      :text="t('toolsChatHeatmap.reportText')"
    >
      <!-- Key Metrics 4-Card Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#0284c7">mdi-clock-time-four-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsChatHeatmap.metricPeakHour")
            }}</span>
            <span class="metric-value">{{ analysis.peakHourLabel }}</span>
            <span class="metric-caption">
              {{
                t("toolsChatHeatmap.captionPeakCount", {
                  count: analysis.peakHourCount,
                })
              }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#21a68d">mdi-calendar-check</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsChatHeatmap.metricPeakDay")
            }}</span>
            <span class="metric-value">{{ peakDayName }}</span>
            <span class="metric-caption">
              {{
                t("toolsChatHeatmap.captionPeakDayPct", {
                  pct: analysis.peakDayPct,
                })
              }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#f59e0b">mdi-white-balance-sunny</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsChatHeatmap.metricDaytime")
            }}</span>
            <span class="metric-value">{{ analysis.dayPct }}%</span>
            <span class="metric-caption">
              {{
                t("toolsChatHeatmap.captionDayHours", { pct: analysis.dayPct })
              }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#6366f1">mdi-weather-night</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsChatHeatmap.metricNighttime")
            }}</span>
            <span class="metric-value">{{ analysis.nightPct }}%</span>
            <span class="metric-caption">
              {{
                t("toolsChatHeatmap.captionNightHours", {
                  pct: analysis.nightPct,
                })
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- 24-Hour Visual Hourly Timeline Graph -->
      <div class="heatmap-chart-card">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">
              {{ t("toolsChatHeatmap.chartTitle") }}
            </h3>
            <span class="mono-label chart-subtitle">{{
              t("toolsChatHeatmap.chartSubtitle")
            }}</span>
          </div>
          <span class="peak-badge mono-label">
            Peak: {{ analysis.peakHourLabel }} ({{ analysis.peakHourCount }})
          </span>
        </div>

        <div class="hourly-bars-container">
          <div
            v-for="(count, hour) in analysis.hourly"
            :key="hour"
            class="hour-bar-col"
          >
            <div class="bar-track">
              <div
                class="bar-fill"
                :class="{ 'is-peak': hour === analysis.peakHour }"
                :style="{
                  height: `${analysis.hourlyPercentages[hour]}%`,
                  background: heatColor(analysis.hourlyPercentages[hour]),
                }"
                :title="`${hour}:00 – ${count} messages`"
              ></div>
            </div>
            <span
              class="hour-label mono-label"
              :class="{ 'is-peak-label': hour === analysis.peakHour }"
            >
              {{ hour % 3 === 0 ? `${hour}h` : "·" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Participant Breakdown Table -->
      <div class="participants-section mt-6">
        <div class="section-header">
          <h3 class="section-title">
            {{ t("toolsChatHeatmap.participantsTitle") }}
          </h3>
          <span class="mono-label section-tag">
            {{
              t("toolsChatHeatmap.participantsCount", {
                count: analysis.participants.length,
              })
            }}
          </span>
        </div>

        <div class="table-container">
          <table class="participants-table">
            <thead>
              <tr>
                <th>{{ t("toolsChatHeatmap.colParticipant") }}</th>
                <th>{{ t("toolsChatHeatmap.colPeakHour") }}</th>
                <th>{{ t("toolsChatHeatmap.colDayShare") }}</th>
                <th>{{ t("toolsChatHeatmap.colNightShare") }}</th>
                <th>{{ t("toolsChatHeatmap.colTotal") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in analysis.participants" :key="p.name">
                <td class="font-weight-bold name-cell">
                  <span class="avatar-circle">{{ p.name.charAt(0) }}</span>
                  {{ p.name }}
                </td>
                <td class="mono-cell font-weight-bold">
                  {{ p.peakHourLabel }}
                </td>
                <td class="mono-cell">{{ p.dayPct }}% Day</td>
                <td class="mono-cell">{{ p.nightPct }}% Night</td>
                <td class="mono-cell font-weight-bold">
                  {{ p.total.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </LandingSection>

    <!-- Conversion Hook (Dark Landing Section) -->
    <LandingSection
      theme="dark"
      :eyebrow="t('toolsChatHeatmap.hookEyebrow')"
      :title="t('toolsChatHeatmap.hookTitle')"
      :text="t('toolsChatHeatmap.hookText')"
    >
      <LandingCards :items="hookFeatures" />
      <div class="hook-actions">
        <LandingButton
          :to="localePath({ path: '/', hash: '#results' })"
          @click="analyticsTools.ctaClick('chat_heatmap', 'full_analyzer')"
        >
          {{ t("toolsChatHeatmap.hookButton") }}
        </LandingButton>
        <p class="hook-note">
          {{ t("toolsChatHeatmap.hookNote") }}
        </p>
      </div>
    </LandingSection>

    <!-- Step-by-Step Guide -->
    <LandingSection
      theme="light"
      :eyebrow="t('toolsChatHeatmap.stepsEyebrow')"
      :title="t('toolsChatHeatmap.stepsTitle')"
    >
      <LandingSteps :steps="exportSteps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("toolsChatHeatmap.guideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <!-- Frequently Asked Questions -->
    <LandingSection theme="white" :title="t('toolsChatHeatmap.faqTitle')">
      <LandingFaq :items="faqItems" />
    </LandingSection>

    <!-- Final Bottom CTA -->
    <LandingCta
      :title="t('toolsChatHeatmap.ctaTitle')"
      :cta-text="t('toolsChatHeatmap.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('toolsChatHeatmap.ctaNote')"
      :disclaimer="t('toolsChatHeatmap.disclaimer')"
      @click="onBottomCtaClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import type { ChatMessage, ChatAttachment } from "~/composables/useChatTool";
import { analyticsTools } from "~/composables/useAnalytics";

const { t } = useI18n();
const localePath = useLocalePath();

function onBottomCtaClick() {
  scrollToDropzone();
  analyticsTools.ctaClick("chat_heatmap", "scroll_to_dropzone");
}

// The last crumb is the tool's name from the shared catalogue
// (composables/useSiteNav.ts), the same string the /tools index, the footer
// and the header use. Each page used to name itself differently here.
const breadcrumbs = useToolBreadcrumbs("toolsHub.toolHeatmapTitle");

useSeoMeta({
  title: () => t("toolsChatHeatmap.seoTitle"),
  description: () => t("toolsChatHeatmap.seoDescription"),
  ogTitle: () => t("toolsChatHeatmap.ogTitle"),
  ogDescription: () => t("toolsChatHeatmap.ogDescription"),
  ogType: "website",
  ogUrl: "https://whatsanalyze.com/tools/chat-heatmap",
});

const analysis = ref<any>(null);

function onChatAnalyzed(payload: {
  analysis: any;
  messages: ChatMessage[];
  attachments: ChatAttachment[];
}) {
  analysis.value = payload.analysis;
}

function onReset() {
  analysis.value = null;
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const peakDayName = computed(() => {
  if (!analysis.value) return "N/A";
  return dayNames[analysis.value.peakDayIndex] || "N/A";
});

/**
 * The page promises a heatmap, so the hours are shaded by how busy they are
 * rather than all drawn in the same blue: one sequential ramp from a pale,
 * quiet hour to a deep, busy one.
 */
function heatColor(pct: number) {
  const intensity = Math.min(1, Math.max(0, (pct || 0) / 100));
  const lightness = 84 - intensity * 48;
  return `hsl(200, 82%, ${lightness}%)`;
}

const hookFeatures = computed(() => [
  {
    icon: "mdi-chart-bell-curve-cumulative",
    title: t("toolsInactivity.hookCard1Title"),
    text: t("toolsInactivity.hookCard1Text"),
  },
  {
    icon: "mdi-emoticon-outline",
    title: t("toolsInactivity.hookCard2Title"),
    text: t("toolsInactivity.hookCard2Text"),
  },
  {
    icon: "mdi-lightning-bolt-outline",
    title: t("toolsInactivity.hookCard3Title"),
    text: t("toolsInactivity.hookCard3Text"),
  },
  {
    icon: "mdi-party-popper",
    title: t("toolsInactivity.hookCard4Title"),
    text: t("toolsInactivity.hookCard4Text"),
  },
]);

const exportSteps = computed(() => [
  {
    title: t("toolsChatHeatmap.step1Title"),
    text: t("toolsChatHeatmap.step1Text"),
  },
  {
    title: t("toolsChatHeatmap.step2Title"),
    text: t("toolsChatHeatmap.step2Text"),
  },
  {
    title: t("toolsChatHeatmap.step3Title"),
    text: t("toolsChatHeatmap.step3Text"),
  },
]);

const faqItems = computed(() => [
  {
    q: t("toolsChatHeatmap.faq1Q"),
    a: t("toolsChatHeatmap.faq1A"),
  },
  {
    q: t("toolsChatHeatmap.faq2Q"),
    a: t("toolsChatHeatmap.faq2A"),
  },
  {
    q: t("toolsChatHeatmap.faq3Q"),
    a: t("toolsChatHeatmap.faq3A"),
  },
  {
    q: t("toolsChatHeatmap.faq4Q"),
    a: t("toolsChatHeatmap.faq4A"),
  },
]);

useToolSchema({
  faqItems,
  app: {
    nameKey: "toolsChatHeatmap.seoTitle",
    descriptionKey: "toolsChatHeatmap.seoDescription",
  },
});
</script>

<style scoped lang="scss">
@include wa-metric-cards;

.heatmap-chart-card {
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1.4rem, 3vw, 2.2rem);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.8rem;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.chart-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.chart-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
}

.peak-badge {
  font-size: 0.78rem;
  font-weight: 700;
  background: #e0f2fe;
  color: #0284c7;
  padding: 4px 12px;
  border-radius: 20px;
}

.hourly-bars-container {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 5px;
  height: 180px;
  align-items: flex-end;
  padding-bottom: 1.8rem;
  position: relative;
}

.hour-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-track {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.4s ease;
  min-height: 2px;

  &.is-peak {
    background: #21a68d !important;
    box-shadow: 0 0 10px rgba(33, 166, 141, 0.5);
  }

  &:hover {
    filter: brightness(1.15);
  }
}

.hour-label {
  position: absolute;
  bottom: 0;
  font-size: 0.7rem;
  color: #94a3b8;
  white-space: nowrap;

  &.is-peak-label {
    color: #21a68d;
    font-weight: 700;
  }
}

.participants-section {
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1.4rem, 3vw, 2rem);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

@include wa-participants-table(#0284c7, rgba(2, 132, 199, 0.12));

.hook-actions {
  margin-top: 2.5rem;
  text-align: center;
}

.hook-note {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: rgba(245, 245, 247, 0.55);
}

.landing-page__guide-link {
  margin-top: 2rem;
  text-align: center;

  a {
    color: $c-blue-accent-dark;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
