<template>
  <div class="landing-page">
    <LandingHero
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('toolsMessageCounter.heroEyebrow')"
      :title="t('toolsMessageCounter.heroTitle')"
      :subtitle="t('toolsMessageCounter.heroSubtitle')"
      :note="t('toolsMessageCounter.heroNote')"
    >
      <div id="dropzone-slot">
        <ToolDropzone
          tool-type="messages"
          @analyzed="onChatAnalyzed"
          @reset="onReset"
        />
      </div>
    </LandingHero>

    <!-- Results Section (Visible when chat is parsed) -->
    <LandingSection
      v-if="analysis"
      theme="light"
      :eyebrow="t('toolsMessageCounter.reportEyebrow')"
      :title="t('toolsMessageCounter.reportTitle')"
      :text="t('toolsMessageCounter.reportText')"
    >
      <!-- Key Metrics 4-Card Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#21a68d">mdi-message-text-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsMessageCounter.metricTotalMessages")
            }}</span>
            <span class="metric-value">{{
              analysis.totalMessages.toLocaleString()
            }}</span>
            <span class="metric-caption">
              {{
                t("toolsMessageCounter.captionMessagesOverDays", {
                  days: analysis.totalDays,
                })
              }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#38bdf8">mdi-format-line-spacing</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsMessageCounter.metricTotalLines")
            }}</span>
            <span class="metric-value">{{
              analysis.totalLines.toLocaleString()
            }}</span>
            <span class="metric-caption">
              {{
                t("toolsMessageCounter.captionLinesPerMsg", {
                  avg: linesPerMessage,
                })
              }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#f59e0b">mdi-speedometer</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsMessageCounter.metricDailyAverage")
            }}</span>
            <span class="metric-value">{{ analysis.avgMessagesPerDay }}</span>
            <span class="metric-caption">
              {{ t("toolsMessageCounter.captionDailyAvg") }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#ec4899">mdi-calendar-star</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsMessageCounter.metricBusiestDay")
            }}</span>
            <span class="metric-value">{{ analysis.busiestDay.dateStr }}</span>
            <span class="metric-caption">
              {{
                t("toolsMessageCounter.captionDayRecord", {
                  count: analysis.busiestDay.count,
                })
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Participant Breakdown Table -->
      <div class="participants-section">
        <div class="section-header">
          <h3 class="section-title">
            {{ t("toolsMessageCounter.participantsTitle") }}
          </h3>
          <span class="mono-label section-tag">
            {{
              t("toolsMessageCounter.participantsCount", {
                count: analysis.participants.length,
              })
            }}
          </span>
        </div>

        <div class="table-container">
          <table class="participants-table">
            <thead>
              <tr>
                <th>{{ t("toolsMessageCounter.colParticipant") }}</th>
                <th>{{ t("toolsMessageCounter.colMessages") }}</th>
                <th>{{ t("toolsMessageCounter.colShare") }}</th>
                <th>{{ t("toolsMessageCounter.colLines") }}</th>
                <th>{{ t("toolsMessageCounter.colChars") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in analysis.participants" :key="p.name">
                <td class="font-weight-bold name-cell">
                  <span class="avatar-circle">{{ p.name.charAt(0) }}</span>
                  {{ p.name }}
                </td>
                <td class="mono-cell font-weight-bold">
                  {{ p.messageCount.toLocaleString() }}
                </td>
                <td class="share-cell">
                  <div class="share-bar-wrap">
                    <div
                      class="share-bar"
                      :style="{ width: `${p.percentage}%` }"
                    ></div>
                    <span class="share-label mono-label"
                      >{{ p.percentage }}%</span
                    >
                  </div>
                </td>
                <td class="mono-cell">{{ p.lineCount.toLocaleString() }}</td>
                <td class="mono-cell">{{ p.charCount.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </LandingSection>

    <!-- Conversion Hook (Dark Landing Section) -->
    <LandingSection
      theme="dark"
      :eyebrow="t('toolsMessageCounter.hookEyebrow')"
      :title="t('toolsMessageCounter.hookTitle')"
      :text="t('toolsMessageCounter.hookText')"
    >
      <LandingCards :items="hookFeatures" />
      <div class="hook-actions">
        <LandingButton :to="localePath('/')">
          {{ t("toolsMessageCounter.hookButton") }}
        </LandingButton>
        <p class="hook-note">
          {{ t("toolsMessageCounter.hookNote") }}
        </p>
      </div>
    </LandingSection>

    <!-- Step-by-Step Guide -->
    <LandingSection
      theme="light"
      :eyebrow="t('toolsMessageCounter.stepsEyebrow')"
      :title="t('toolsMessageCounter.stepsTitle')"
    >
      <LandingSteps :steps="exportSteps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("toolsMessageCounter.guideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <!-- Frequently Asked Questions -->
    <LandingSection theme="white" :title="t('toolsMessageCounter.faqTitle')">
      <LandingFaq :items="faqItems" />
    </LandingSection>

    <!-- Final Bottom CTA -->
    <LandingCta
      :title="t('toolsMessageCounter.ctaTitle')"
      :cta-text="t('toolsMessageCounter.ctaButton')"
      cta-to="#"
      :note="t('toolsMessageCounter.ctaNote')"
      :disclaimer="t('toolsMessageCounter.disclaimer')"
      @click="scrollToDropzone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import type { ChatMessage, ChatAttachment } from "~/composables/useChatTool";

const { t } = useI18n();
const localePath = useLocalePath();

const breadcrumbs = computed(() => [
  { label: "WhatsAnalyze", to: localePath("/") },
  { label: "Tools", to: localePath("/tools") },
  { label: t("toolsMessageCounter.heroTitle") },
]);

useSeoMeta({
  title: () => t("toolsMessageCounter.seoTitle"),
  description: () => t("toolsMessageCounter.seoDescription"),
  ogTitle: () => t("toolsMessageCounter.ogTitle"),
  ogDescription: () => t("toolsMessageCounter.ogDescription"),
  ogType: "website",
  ogUrl: "https://www.whatsanalyze.com/tools/message-counter",
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

const linesPerMessage = computed(() => {
  if (!analysis.value || analysis.value.totalMessages === 0) return 1;
  return (
    Math.round(
      (analysis.value.totalLines / analysis.value.totalMessages) * 10
    ) / 10
  );
});

function scrollToDropzone() {
  const el = document.getElementById("dropzone-slot");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
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
    title: t("toolsMessageCounter.step1Title"),
    text: t("toolsMessageCounter.step1Text"),
  },
  {
    title: t("toolsMessageCounter.step2Title"),
    text: t("toolsMessageCounter.step2Text"),
  },
  {
    title: t("toolsMessageCounter.step3Title"),
    text: t("toolsMessageCounter.step3Text"),
  },
]);

const faqItems = computed(() => [
  {
    q: t("toolsMessageCounter.faq1Q"),
    a: t("toolsMessageCounter.faq1A"),
  },
  {
    q: t("toolsMessageCounter.faq2Q"),
    a: t("toolsMessageCounter.faq2A"),
  },
  {
    q: t("toolsMessageCounter.faq3Q"),
    a: t("toolsMessageCounter.faq3A"),
  },
  {
    q: t("toolsMessageCounter.faq4Q"),
    a: t("toolsMessageCounter.faq4A"),
  },
]);

useHead(() => ({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            name: t("toolsMessageCounter.seoTitle"),
            operatingSystem: "All (Web-based)",
            applicationCategory: "UtilitiesApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            description: t("toolsMessageCounter.seoDescription"),
          },
          {
            "@type": "FAQPage",
            mainEntity: faqItems.value.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          },
        ],
      }),
    },
  ],
}));
</script>

<style scoped lang="scss">
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2.5rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.4rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-meta {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.metric-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.15;
}

.metric-caption {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.participants-section {
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1.4rem, 3vw, 2rem);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.section-tag {
  font-size: 0.75rem;
  font-weight: 700;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  color: #475569;
}

.table-container {
  overflow-x: auto;
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 1rem;
    font-size: 0.95rem;
    color: #1e293b;
    border-bottom: 1px solid #f1f5f9;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0f2fe;
  color: #0284c7;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.mono-cell {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.share-cell {
  min-width: 140px;
}

.share-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.share-bar {
  height: 8px;
  background: #21a68d;
  border-radius: 4px;
  min-width: 4px;
}

.share-label {
  font-size: 0.8rem;
  color: #64748b;
}

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
