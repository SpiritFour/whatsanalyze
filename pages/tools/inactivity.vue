<template>
  <div class="inactivity-tool-page">
    <!-- Breadcrumb Bar -->
    <nav class="breadcrumb-nav">
      <NuxtLink to="/" class="breadcrumb-link">WhatsAnalyze</NuxtLink>
      <span class="breadcrumb-separator">/</span>
      <NuxtLink to="/tools" class="breadcrumb-link">Tools</NuxtLink>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Inactivity & Last Message Tracker</span>
    </nav>

    <!-- Hero Header -->
    <header class="tool-hero">
      <div class="tool-category-badge mono-label">
        <span class="badge-dot"></span>
        WHATSAPP UTILITY SUITE
      </div>

      <h1 class="tool-title">
        Who Texted Last? <br />
        <span class="gradient-text">WhatsApp Inactivity & Gap Tracker</span>
      </h1>

      <p class="tool-intro">
        Discover who sent the last message, calculate elapsed silence duration,
        measure reply latencies, and pinpoint the longest conversation gaps.
        Client-side, instant, and 100% private.
      </p>
    </header>

    <!-- BLUF / LLM Definition Card -->
    <ToolBluf
      title="WhatsApp Inactivity Analysis Specification"
      summary="The WhatsApp Inactivity Tracker evaluates exported chat transcripts locally in your browser to determine the final message sender, quantify dormant intervals, and benchmark conversational turn-taking without transmitting data across external networks."
      :facts="blufFacts"
    />

    <!-- Interactive Dropzone -->
    <section class="dropzone-section">
      <ToolDropzone @analyzed="onChatAnalyzed" @reset="onReset" />
    </section>

    <!-- Results Dashboard (Visible when chat is parsed) -->
    <section v-if="analysis" class="analysis-results-section">
      <!-- Hero Metric Banner -->
      <div
        class="hero-metric-card"
        :style="{ '--status-color': analysis.inactivityColor }"
      >
        <div class="status-pill">
          <span class="status-indicator"></span>
          <span class="status-text">{{ analysis.inactivityStatusLabel }}</span>
        </div>

        <div class="hero-headline">
          <span class="hero-sublabel">LAST MESSAGE WAS SENT BY</span>
          <h2 class="hero-author">{{ analysis.lastMessage.author }}</h2>
          <div class="hero-time">
            <span class="time-relative">{{
              analysis.timeSinceLastFormatted
            }}</span>
            <span class="time-exact mono-label">({{ formattedLastDate }})</span>
          </div>
        </div>

        <div class="last-message-quote">
          <v-icon size="18" color="#718096" class="quote-icon"
            >mdi-format-quote-open</v-icon
          >
          <p class="quote-text">{{ analysis.lastMessage.message }}</p>
        </div>
      </div>

      <!-- Key Metrics Row -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#60d8bd">mdi-timer-sand</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">LONGEST SILENCE GAP</span>
            <span class="metric-value">{{ topGapFormatted }}</span>
            <span class="metric-caption">
              Revived by {{ topGapBrokenBy }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#ffd45c">mdi-reply-all-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">FIRST RESPONDER</span>
            <span class="metric-value">{{ topInitiatorName }}</span>
            <span class="metric-caption">
              Started {{ topInitiatorPct }}% of conversations
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#ff8f00">mdi-speedometer</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">FASTEST REPLY TIME</span>
            <span class="metric-value">{{ fastestResponderTime }}</span>
            <span class="metric-caption">
              {{ fastestResponderName }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#00e676">mdi-message-text-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">TOTAL MESSAGES</span>
            <span class="metric-value">{{
              analysis.totalMessages.toLocaleString()
            }}</span>
            <span class="metric-caption">
              Over {{ analysis.dateRange.totalDays }} days
            </span>
          </div>
        </div>
      </div>

      <!-- Participant Inactivity Table -->
      <div class="participants-section">
        <div class="section-header">
          <h3 class="section-title">
            Participant Activity & Latency Breakdown
          </h3>
          <span class="mono-label section-tag"
            >{{ analysis.participants.length }} PARTICIPANTS</span
          >
        </div>

        <div class="table-container">
          <table class="participants-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Last Active</th>
                <th>Last Snippet</th>
                <th>Avg Reply Latency</th>
                <th>Starters Ratio</th>
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
          <h3 class="section-title">Longest Silence Periods (Chat Gaps)</h3>
          <span class="mono-label section-tag">TOP HISTORICAL DORMANCIES</span>
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
                {{ gap.durationFormatted }} of silence
              </div>
              <div class="gap-interval mono-label">
                {{ formatDate(gap.startDate) }} → {{ formatDate(gap.endDate) }}
              </div>
              <div class="gap-broken">
                Silence broken by <strong>{{ gap.brokenBy }}</strong
                >:
                <span class="snippet"
                  >"{{ truncate(gap.messageAfter, 60) }}"</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- The Magnetic Full Analysis Hook -->
    <ToolHook />

    <!-- Educational & How-to Guide for SEO / LLM Ranking -->
    <article class="guide-article">
      <div class="guide-header">
        <span class="guide-badge mono-label">EXPLAINER & TUTORIAL</span>
        <h2 class="guide-title">
          How to Check WhatsApp Inactivity and Ghosting
        </h2>
      </div>

      <div class="guide-content">
        <h3>1. How WhatsApp Inactivity is Computed</h3>
        <p>
          Unlike WhatsApp itself, which only displays individual read receipts
          or "Last Seen" timestamps for active connections, exported chat logs
          preserve exact millisecond-precision histories. By parsing message
          timestamps chronologically:
        </p>
        <ul>
          <li>
            <strong>Current Inactivity:</strong> Measured as the elapsed delta
            between the final message timestamp and the current system clock.
          </li>
          <li>
            <strong>Conversation Breaks:</strong> Any silence gap exceeding 6
            hours without communication marks the end of an active exchange and
            the start of an inactive phase.
          </li>
          <li>
            <strong>Turn-Taking Response Latency:</strong> Calculated
            specifically when one participant sends a message immediately
            following an interlocutor's statement.
          </li>
        </ul>

        <h3>2. How to Export Your WhatsApp Chat</h3>
        <div class="platform-steps-grid">
          <div class="step-card">
            <h4>📱 iPhone (iOS)</h4>
            <ol>
              <li>Open WhatsApp and select the target chat.</li>
              <li>Tap the contact or group name at the very top.</li>
              <li>
                Scroll to the bottom and select <strong>Export Chat</strong>.
              </li>
              <li>
                Choose <strong>Without Media</strong> for instant processing.
              </li>
              <li>Save to "Files" or AirDrop to your computer.</li>
            </ol>
          </div>

          <div class="step-card">
            <h4>🤖 Android</h4>
            <ol>
              <li>Open the WhatsApp conversation.</li>
              <li>Tap the three vertical dots (⋮) in the top right corner.</li>
              <li>
                Select <strong>More</strong> → <strong>Export chat</strong>.
              </li>
              <li>Select <strong>Without Media</strong>.</li>
              <li>Share or save the generated <code>.txt</code> file.</li>
            </ol>
          </div>
        </div>

        <h3>3. Zero-Knowledge Privacy Guarantee</h3>
        <p>
          WhatsApp chats contain intimate personal exchanges. WhatsAnalyze
          operates under a strict
          <strong>Zero-Knowledge client architecture</strong>. The entire parser
          runs exclusively inside your browser's JavaScript V8/WebAssembly
          sandbox. No text, timestamps, names, or metadata are ever transmitted
          to any remote server or third-party tracking endpoint.
        </p>
      </div>
    </article>

    <!-- Technical FAQ Component -->
    <ToolFaq :items="faqItems" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import ToolHook from "~/components/tools/ToolHook.vue";
import ToolBluf, { type BlufFact } from "~/components/tools/ToolBluf.vue";
import ToolFaq, { type FaqItem } from "~/components/tools/ToolFaq.vue";
import {
  type ChatInactivityAnalysis,
  type ChatMessage,
  type ChatAttachment,
} from "~/composables/useChatTool";

// SEO Metadata & Generative Engine Optimization
useSeoMeta({
  title: "Who Texted Last? WhatsApp Inactivity & Gap Tracker | WhatsAnalyze",
  description:
    "Free WhatsApp inactivity checker. Find out who sent the last message, calculate chat silence duration, detect ghosting, and analyze reply latency 100% privately in your browser.",
  ogTitle: "Who Texted Last? WhatsApp Inactivity & Gap Tracker",
  ogDescription:
    "Check who sent the last WhatsApp message, how long the conversation has been dormant, and reply latencies with zero server upload.",
  ogType: "website",
  ogUrl: "https://www.whatsanalyze.com/tools/inactivity",
});

// JSON-LD Structured Data for AI search & rich snippets
useHead({
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "WhatsAnalyze WhatsApp Inactivity Tracker",
            "operatingSystem": "All (Web-based)",
            "applicationCategory": "UtilitiesApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
            },
            "description":
              "Client-side tool to analyze WhatsApp chat inactivity, last message senders, and response latencies.",
          },
          {
            "@type": "HowTo",
            "name": "How to check who texted last in a WhatsApp chat",
            "step": [
              {
                "@type": "HowToStep",
                "name": "Export WhatsApp Chat",
                "text": "Export your WhatsApp chat without media as a .txt or .zip file.",
              },
              {
                "@type": "HowToStep",
                "name": "Drop File in WhatsAnalyze Inactivity Tool",
                "text": "Drop the exported chat file into the tool dropzone.",
              },
              {
                "@type": "HowToStep",
                "name": "View Inactivity Metrics",
                "text": "Inspect the last message sender, elapsed silence time, and conversation gaps instantly.",
              },
            ],
          },
        ],
      }),
    },
  ],
});

const analysis = ref<ChatInactivityAnalysis | null>(null);

const blufFacts: BlufFact[] = [
  { label: "Supported Formats", value: "WhatsApp .txt and .zip exports" },
  { label: "Security Spec", value: "100% Client-Side (Zero Server Upload)" },
  { label: "Core Metrics", value: "Last sender, silence gap, reply latencies" },
  { label: "Pricing", value: "Completely Free / Open Source" },
];

const faqItems: FaqItem[] = [
  {
    question: "Can I see who sent the last message in a group chat?",
    answer:
      "Yes. The inactivity tool lists every participant alongside their specific last message timestamp, making it easy to see who went silent first and who holds the last word.",
  },
  {
    question: "Is my chat data uploaded or saved anywhere?",
    answer:
      "No. All parsing and metric calculations execute purely in your browser's local memory. No chat text or metadata ever leaves your device.",
  },
  {
    question: "What defines a 'Silence Gap' or conversation break?",
    answer:
      "A silence gap occurs when more than 6 hours pass between two consecutive messages. The longest gaps represent historical periods of dormancy.",
  },
  {
    question: "Does this work with both Android and iOS exports?",
    answer:
      "Yes. The parser supports all WhatsApp date and timestamp conventions across iOS, Android, and WhatsApp Web exports.",
  },
];

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
  if (!analysis.value || analysis.value.conversationInitiations.breakdown.length === 0) return "N/A";
  const sorted = [...analysis.value.conversationInitiations.breakdown].sort((a, b) => b.count - a.count);
  return sorted[0]?.author || "N/A";
});

const topInitiatorPct = computed(() => {
  if (!analysis.value || analysis.value.conversationInitiations.breakdown.length === 0) return 0;
  const sorted = [...analysis.value.conversationInitiations.breakdown].sort((a, b) => b.count - a.count);
  return sorted[0]?.percentage || 0;
});

const fastestResponder = computed(() => {
  if (!analysis.value) return null;
  const candidates = analysis.value.participants.filter((p) => p.avgResponseTimeMs > 0);
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs)[0];
});

const fastestResponderName = computed(() => fastestResponder.value?.name || "N/A");
const fastestResponderTime = computed(() => fastestResponder.value?.avgResponseTimeFormatted || "N/A");

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
</script>

<style scoped lang="scss">
.inactivity-tool-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 20px 100px;
  color: #f7fafc;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  margin-bottom: 32px;
}

.breadcrumb-link {
  color: #718096;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #60d8bd;
  }
}

.breadcrumb-separator {
  color: #4a5568;
}

.breadcrumb-current {
  color: #e2e8f0;
  font-weight: 500;
}

.tool-hero {
  text-align: center;
  margin-bottom: 40px;
}

.tool-category-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(33, 166, 141, 0.1);
  border: 1px solid rgba(33, 166, 141, 0.25);
  padding: 4px 14px;
  border-radius: 100px;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: #60d8bd;
  margin-bottom: 18px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e676;
}

.tool-title {
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.035em;
  color: #ffffff;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.gradient-text {
  background: linear-gradient(135deg, #ffffff 30%, #60d8bd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tool-intro {
  font-size: 1.15rem;
  color: #a0aec0;
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.6;
}

.mono-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.dropzone-section {
  margin-bottom: 48px;
}

.analysis-results-section {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-metric-card {
  background: linear-gradient(
    145deg,
    rgba(17, 24, 32, 0.9),
    rgba(11, 18, 24, 0.95)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 36px;
  margin-bottom: 24px;
  position: relative;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 20px;
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
  font-weight: 600;
  color: #f7fafc;
}

.hero-headline {
  margin-bottom: 20px;
}

.hero-sublabel {
  display: block;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: #718096;
  margin-bottom: 6px;
}

.hero-author {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin-bottom: 6px;
}

.hero-time {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.time-relative {
  font-size: 1.25rem;
  font-weight: 600;
  color: #60d8bd;
}

.time-exact {
  font-size: 0.85rem;
  color: #718096;
}

.last-message-quote {
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid #21a68d;
  border-radius: 0 12px 12px 0;
  padding: 14px 20px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.quote-text {
  font-size: 0.98rem;
  color: #e2e8f0;
  font-style: italic;
  margin: 0;
  line-height: 1.5;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-meta {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: #718096;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 2px;
}

.metric-caption {
  font-size: 0.78rem;
  color: #a0aec0;
}

.participants-section,
.gaps-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f7fafc;
}

.section-tag {
  font-size: 0.72rem;
  color: #718096;
}

.table-container {
  overflow-x: auto;
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;

  th {
    padding: 12px 14px;
    font-size: 0.72rem;
    font-family: ui-monospace, monospace;
    color: #718096;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  td {
    padding: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #e2e8f0;
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
  background: rgba(33, 166, 141, 0.2);
  color: #60d8bd;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.mono-cell {
  font-family: ui-monospace, monospace;
  font-size: 0.84rem;
  color: #cbd5e0;
}

.snippet-cell {
  color: #a0aec0;
  font-style: italic;
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 16px 20px;
}

.gap-rank {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 700;
}

.gap-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gap-duration {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
}

.gap-interval {
  font-size: 0.75rem;
  color: #718096;
}

.gap-broken {
  font-size: 0.86rem;
  color: #cbd5e0;
  margin-top: 4px;

  strong {
    color: #60d8bd;
  }

  .snippet {
    color: #a0aec0;
    font-style: italic;
  }
}

.guide-article {
  margin-top: 60px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 40px;

  @media (max-width: 640px) {
    padding: 24px;
  }
}

.guide-badge {
  color: #60d8bd;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  display: block;
}

.guide-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 24px;
}

.guide-content {
  color: #cbd5e0;
  line-height: 1.7;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f7fafc;
    margin: 28px 0 12px;
  }

  p {
    margin-bottom: 16px;
  }

  ul {
    margin-bottom: 20px;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
    }
  }
}

.platform-steps-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 20px 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.step-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;

  h4 {
    color: #ffffff;
    font-size: 1.05rem;
    margin-bottom: 12px;
  }

  ol {
    padding-left: 18px;
    font-size: 0.9rem;
    color: #a0aec0;

    li {
      margin-bottom: 6px;
    }
  }
}
</style>
