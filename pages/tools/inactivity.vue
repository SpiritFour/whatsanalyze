<template>
  <div class="landing-page">
    <!-- Hero with ToolDropzone Visual Slot -->
    <LandingHero
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('toolsInactivity.heroEyebrow')"
      :title="t('toolsInactivity.heroTitle')"
      :subtitle="t('toolsInactivity.heroSubtitle')"
      :note="t('toolsInactivity.heroNote')"
    >
      <div id="dropzone-slot">
        <ToolDropzone @analyzed="onChatAnalyzed" @reset="onReset" />
      </div>
    </LandingHero>

    <!-- Results Section (Visible when chat is parsed) -->
    <LandingSection
      v-if="analysis"
      theme="light"
      :eyebrow="t('toolsInactivity.reportEyebrow')"
      :title="t('toolsInactivity.reportTitle')"
      :text="t('toolsInactivity.reportText')"
    >
      <!-- Hero Metric Card -->
      <div
        class="hero-metric-card"
        :style="{ '--status-color': analysis.inactivityColor }"
      >
        <div class="status-pill">
          <span class="status-indicator"></span>
          <span class="status-text">{{ localizedStatusText }}</span>
        </div>

        <div class="hero-headline">
          <span class="hero-sublabel">{{
            t("toolsInactivity.lastMessageSentBy")
          }}</span>
          <h2 class="hero-author">{{ analysis.lastMessage.author }}</h2>
          <div class="hero-time">
            <span class="time-relative">{{
              analysis.timeSinceLastFormatted
            }}</span>
            <span class="time-exact mono-label">({{ formattedLastDate }})</span>
          </div>
        </div>

        <div class="last-message-quote">
          <v-icon size="18" color="#718096" class="quote-icon">
            mdi-format-quote-open
          </v-icon>
          <p class="quote-text">{{ analysis.lastMessage.message }}</p>
        </div>
      </div>

      <!-- Key Metrics 4-Card Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#21a68d">mdi-timer-sand</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsInactivity.metricLongestSilence")
            }}</span>
            <span class="metric-value">{{ topGapFormatted }}</span>
            <span class="metric-caption">
              {{
                t("toolsInactivity.metricRevivedBy", { name: topGapBrokenBy })
              }}
            </span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#ffd45c">mdi-reply-all-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsInactivity.metricTopInitiator")
            }}</span>
            <span class="metric-value">{{ topInitiatorName }}</span>
            <span class="metric-caption">
              {{
                t("toolsInactivity.metricStartedConversations", {
                  pct: topInitiatorPct,
                })
              }}
            </span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#ff8f00">mdi-speedometer</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsInactivity.metricFastestReply")
            }}</span>
            <span class="metric-value">{{ fastestResponderTime }}</span>
            <span class="metric-caption">{{ fastestResponderName }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#00e676">mdi-message-text-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsInactivity.metricTotalMessages")
            }}</span>
            <span class="metric-value">
              {{ analysis.totalMessages.toLocaleString() }}
            </span>
            <span class="metric-caption">
              {{
                t("toolsInactivity.metricOverDays", {
                  days: analysis.dateRange.totalDays,
                })
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Participant Activity & Latency Breakdown Table -->
      <div class="participants-section">
        <div class="section-header">
          <h3 class="section-title">
            {{ t("toolsInactivity.participantsTitle") }}
          </h3>
          <span class="mono-label section-tag">
            {{
              t("toolsInactivity.participantsCount", {
                count: analysis.participants.length,
              })
            }}
          </span>
        </div>

        <div class="table-container">
          <table class="participants-table">
            <thead>
              <tr>
                <th>{{ t("toolsInactivity.colParticipant") }}</th>
                <th>{{ t("toolsInactivity.colLastActive") }}</th>
                <th>{{ t("toolsInactivity.colLastMessage") }}</th>
                <th>{{ t("toolsInactivity.colMedianReply") }}</th>
                <th>{{ t("toolsInactivity.colShare") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in analysis.participants" :key="p.name">
                <td class="font-weight-bold name-cell">
                  <span class="avatar-circle">{{ p.name.charAt(0) }}</span>
                  {{ p.name }}
                </td>
                <td class="mono-cell">{{ p.timeSinceLastFormatted }}</td>
                <td class="snippet-cell">
                  "{{ truncate(p.lastMessage.message, 50) }}"
                </td>
                <td class="mono-cell">{{ p.avgResponseTimeFormatted }}</td>
                <td class="mono-cell">
                  {{ p.conversationStartersPct }}% ({{
                    p.conversationStartersCount
                  }})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Silence Gaps History -->
      <div
        v-if="analysis.longestGaps && analysis.longestGaps.length > 0"
        class="gaps-section"
      >
        <div class="section-header">
          <h3 class="section-title">{{ t("toolsInactivity.gapsTitle") }}</h3>
          <span class="mono-label section-tag">{{
            t("toolsInactivity.gapsBadge")
          }}</span>
        </div>

        <div class="gaps-list">
          <div
            v-for="(gap, index) in analysis.longestGaps"
            :key="index"
            class="gap-card"
          >
            <div class="gap-rank mono-label">#{{ index + 1 }}</div>
            <div class="gap-content">
              <div class="gap-duration">
                {{ gap.durationFormatted }} {{ t("toolsInactivity.ofSilence") }}
              </div>
              <div class="gap-interval mono-label">
                {{ formatDate(gap.startDate) }} → {{ formatDate(gap.endDate) }}
              </div>
              <div class="gap-broken">
                {{
                  t("toolsInactivity.silenceBrokenBy", { name: gap.brokenBy })
                }}
                <span class="snippet"
                  >"{{ truncate(gap.messageAfter, 60) }}"</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>

    <!-- Conversion Hook (Dark Landing Section) -->
    <LandingSection
      theme="dark"
      :eyebrow="t('toolsInactivity.hookEyebrow')"
      :title="t('toolsInactivity.hookTitle')"
      :text="t('toolsInactivity.hookText')"
    >
      <LandingCards :items="fullAnalysisFeatures" />
      <div class="hook-actions">
        <LandingButton
          :to="localePath({ path: '/', hash: '#results' })"
          @click="openFullAnalysis"
        >
          {{ t("toolsInactivity.hookButton") }}
        </LandingButton>
        <p class="hook-note">
          {{ t("toolsInactivity.hookNote") }}
        </p>
      </div>
    </LandingSection>

    <!-- Methodology & Precision Section -->
    <LandingSection
      theme="white"
      :eyebrow="t('toolsInactivity.methodologyEyebrow')"
      :title="t('toolsInactivity.methodologyTitle')"
      :text="t('toolsInactivity.methodologyText')"
    >
      <LandingCards :items="methodologyCards" />
    </LandingSection>

    <!-- Step-by-Step Export Guide -->
    <LandingSection
      theme="light"
      :eyebrow="t('toolsInactivity.stepsEyebrow')"
      :title="t('toolsInactivity.stepsTitle')"
    >
      <LandingSteps :steps="exportSteps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("toolsInactivity.guideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <!-- Frequently Asked Questions -->
    <LandingSection theme="white" :title="t('toolsInactivity.faqTitle')">
      <LandingFaq :items="faqItems" />
    </LandingSection>

    <!-- Final Bottom CTA -->
    <LandingCta
      :title="t('toolsInactivity.ctaTitle')"
      :cta-text="t('toolsInactivity.ctaButton')"
      cta-to="#"
      :note="t('toolsInactivity.ctaNote')"
      :disclaimer="t('toolsInactivity.disclaimer')"
      @click="scrollToDropzone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import {
  type ChatInactivityAnalysis,
  type ChatMessage,
  type ChatAttachment,
} from "~/composables/useChatTool";

const { t } = useI18n();
const localePath = useLocalePath();

const breadcrumbs = computed(() => [
  { label: t("toolsInactivity.breadcrumbHome"), to: localePath("/") },
  { label: t("toolsInactivity.breadcrumbTools"), to: localePath("/tools") },
  { label: t("toolsInactivity.breadcrumbCurrent") },
]);

// SEO Metadata & Generative Engine Optimization
useSeoMeta({
  title: () => t("toolsInactivity.seoTitle"),
  description: () => t("toolsInactivity.seoDescription"),
  ogTitle: () => t("toolsInactivity.ogTitle"),
  ogDescription: () => t("toolsInactivity.ogDescription"),
  ogType: "website",
  ogUrl: "https://www.whatsanalyze.com/tools/inactivity",
});

const localizedStatusText = computed(() => {
  if (!analysis.value) return "";
  const key = `toolsInactivity.status_${analysis.value.inactivityStatus}`;
  const translated = t(key);
  return translated !== key ? translated : analysis.value.inactivityStatusLabel;
});

const faqItems = computed(() => [
  {
    q: t("toolsInactivity.faq1Q"),
    a: t("toolsInactivity.faq1A"),
  },
  {
    q: t("toolsInactivity.faq2Q"),
    a: t("toolsInactivity.faq2A"),
  },
  {
    q: t("toolsInactivity.faq3Q"),
    a: t("toolsInactivity.faq3A"),
  },
  {
    q: t("toolsInactivity.faq4Q"),
    a: t("toolsInactivity.faq4A"),
  },
]);

// JSON-LD Structured Data
useHead(() => ({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            name: t("toolsInactivity.seoTitle"),
            operatingSystem: "All (Web-based)",
            applicationCategory: "UtilitiesApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            description: t("toolsInactivity.seoDescription"),
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

const analysis = ref<ChatInactivityAnalysis | null>(null);

function onChatAnalyzed(payload: {
  analysis: ChatInactivityAnalysis;
  messages: ChatMessage[];
  attachments: ChatAttachment[];
}) {
  analysis.value = payload.analysis;
}

function onReset() {
  analysis.value = null;
}

const formattedLastDate = computed(() => {
  if (!analysis.value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(analysis.value.lastMessage.date);
});

const topGapFormatted = computed(() => {
  if (!analysis.value || analysis.value.longestGaps.length === 0) return "None";
  return analysis.value.longestGaps[0].durationFormatted;
});

const topGapBrokenBy = computed(() => {
  if (!analysis.value || analysis.value.longestGaps.length === 0) return "N/A";
  return analysis.value.longestGaps[0].brokenBy;
});

const topInitiatorName = computed(() => {
  if (
    !analysis.value ||
    analysis.value.conversationInitiations.breakdown.length === 0
  )
    return "N/A";
  const sorted = [
    ...analysis.value.conversationInitiations.breakdown,
  ].sort((a, b) => b.count - a.count);
  return sorted[0]?.author || "N/A";
});

const topInitiatorPct = computed(() => {
  if (
    !analysis.value ||
    analysis.value.conversationInitiations.breakdown.length === 0
  )
    return 0;
  const sorted = [
    ...analysis.value.conversationInitiations.breakdown,
  ].sort((a, b) => b.count - a.count);
  return sorted[0]?.percentage || 0;
});

const fastestResponder = computed(() => {
  if (!analysis.value) return null;
  const candidates = analysis.value.participants.filter(
    (p) => p.avgResponseTimeMs > 0
  );
  if (candidates.length === 0) return null;
  return candidates.sort(
    (a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs
  )[0];
});

const fastestResponderName = computed(
  () => fastestResponder.value?.name || "N/A"
);
const fastestResponderTime = computed(
  () => fastestResponder.value?.avgResponseTimeFormatted || "N/A"
);

function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function scrollToDropzone() {
  const el = document.getElementById("dropzone-slot");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function openFullAnalysis() {
  // Shared chat is already loaded in useSharedChat
}

const fullAnalysisFeatures = computed(() => [
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

const methodologyCards = computed(() => [
  {
    icon: "mdi-clock-check-outline",
    title: t("toolsInactivity.methodCard1Title"),
    text: t("toolsInactivity.methodCard1Text"),
  },
  {
    icon: "mdi-chat-processing-outline",
    title: t("toolsInactivity.methodCard2Title"),
    text: t("toolsInactivity.methodCard2Text"),
  },
  {
    icon: "mdi-timer-sand-complete",
    title: t("toolsInactivity.methodCard3Title"),
    text: t("toolsInactivity.methodCard3Text"),
  },
]);

const exportSteps = computed(() => [
  {
    title: t("toolsInactivity.step1Title"),
    text: t("toolsInactivity.step1Text"),
  },
  {
    title: t("toolsInactivity.step2Title"),
    text: t("toolsInactivity.step2Text"),
  },
  {
    title: t("toolsInactivity.step3Title"),
    text: t("toolsInactivity.step3Text"),
  },
]);
</script>

<style scoped lang="scss">
.hero-metric-card {
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1.8rem, 4vw, 2.5rem);
  margin-bottom: 2rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
  text-align: left;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f7;
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 1.2rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--status-color, #00e676);
  box-shadow: 0 0 10px var(--status-color, #00e676);
}

.status-text {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1d1d1f;
}

.hero-headline {
  margin-bottom: 1.4rem;
}

.hero-sublabel {
  display: block;
  font-family: ui-monospace, monospace;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: rgba(29, 29, 31, 0.55);
  margin-bottom: 0.35rem;
}

.hero-author {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1d1d1f;
  margin-bottom: 0.35rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.hero-time {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.time-relative {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.time-exact {
  font-size: 0.85rem;
  color: rgba(29, 29, 31, 0.55);
}

.last-message-quote {
  background: #f5f5f7;
  border-left: 3px solid #21a68d;
  border-radius: 0 12px 12px 0;
  padding: 14px 18px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.quote-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.quote-text {
  font-size: 0.95rem;
  color: #1d1d1f;
  font-style: italic;
  margin: 0;
  line-height: 1.5;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: pre-wrap;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
  margin-bottom: 2.4rem;
}

.metric-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 1.6rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-meta {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: rgba(29, 29, 31, 0.55);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.02em;
  margin-bottom: 2px;
}

.metric-caption {
  font-size: 0.8rem;
  color: rgba(29, 29, 31, 0.65);
}

.participants-section,
.gaps-section {
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1.6rem, 3.5vw, 2.2rem);
  margin-bottom: 2.4rem;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
  text-align: left;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1d1d1f;
}

.section-tag {
  font-size: 0.72rem;
  color: rgba(29, 29, 31, 0.55);
  font-weight: 700;
}

.table-container {
  overflow-x: auto;
  width: 100%;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;

  th {
    padding: 12px 14px;
    font-size: 0.74rem;
    font-family: ui-monospace, monospace;
    color: rgba(29, 29, 31, 0.6);
    background: #f5f5f7;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(29, 29, 31, 0.1);
  }

  td {
    padding: 14px;
    border-bottom: 1px solid rgba(29, 29, 31, 0.06);
    color: #1d1d1f;
  }
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(33, 166, 141, 0.15);
  color: #21a68d;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.mono-cell {
  font-family: ui-monospace, monospace;
  font-size: 0.84rem;
  color: #1d1d1f;
}

.snippet-cell {
  color: rgba(29, 29, 31, 0.6);
  font-style: italic;
  min-width: 120px;
  max-width: 240px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.gaps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gap-card {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #f5f5f7;
  border-radius: 14px;
  padding: 16px 20px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;

  @media (max-width: 600px) {
    gap: 12px;
    padding: 14px 14px;
  }
}

.gap-rank {
  font-size: 0.88rem;
  color: rgba(29, 29, 31, 0.45);
  font-weight: 700;
  flex-shrink: 0;
}

.gap-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.gap-duration {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1d1d1f;
}

.gap-interval {
  font-size: 0.76rem;
  color: rgba(29, 29, 31, 0.55);
}

.gap-broken {
  font-size: 0.88rem;
  color: #1d1d1f;
  margin-top: 4px;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;

  strong {
    color: #21a68d;
  }

  .snippet {
    color: rgba(29, 29, 31, 0.6);
    font-style: italic;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: inline;
  }
}

.hook-actions {
  margin-top: 2.4rem;
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

.mono-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
