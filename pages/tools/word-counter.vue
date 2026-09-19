<template>
  <div class="landing-page">
    <LandingHero
      :breadcrumbs="breadcrumbs"
      :eyebrow="t('toolsWordCounter.heroEyebrow')"
      :title="t('toolsWordCounter.heroTitle')"
      :subtitle="t('toolsWordCounter.heroSubtitle')"
      :note="t('toolsWordCounter.heroNote')"
    >
      <div id="dropzone-slot">
        <ToolDropzone
          tool-type="words"
          @analyzed="onChatAnalyzed"
          @reset="onReset"
        />
      </div>
    </LandingHero>

    <!-- Results Section (Visible when chat is parsed) -->
    <LandingSection
      v-if="analysis"
      theme="light"
      :eyebrow="t('toolsWordCounter.reportEyebrow')"
      :title="t('toolsWordCounter.reportTitle')"
      :text="t('toolsWordCounter.reportText')"
    >
      <!-- Key Metrics 4-Card Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#a855f7">mdi-format-letter-case</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsWordCounter.metricTotalWords")
            }}</span>
            <span class="metric-value">{{
              analysis.totalWords.toLocaleString()
            }}</span>
            <span class="metric-caption">{{
              t("toolsWordCounter.captionAvgPace")
            }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#21a68d">mdi-book-open-page-variant-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsWordCounter.metricUniqueWords")
            }}</span>
            <span class="metric-value">{{
              analysis.uniqueWords.toLocaleString()
            }}</span>
            <span class="metric-caption">
              {{
                t("toolsWordCounter.captionUniqueRatio", {
                  count: analysis.uniqueWords,
                })
              }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#38bdf8">mdi-text-box-search-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsWordCounter.metricAvgWords")
            }}</span>
            <span class="metric-value">{{ analysis.avgWordsPerMessage }}</span>
            <span class="metric-caption">{{
              t("toolsWordCounter.captionAvgPace")
            }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <v-icon color="#f59e0b">mdi-star-shooting-outline</v-icon>
          </div>
          <div class="metric-meta">
            <span class="metric-label mono-label">{{
              t("toolsWordCounter.metricLongestMessage")
            }}</span>
            <span class="metric-value"
              >{{ analysis.longestMessage.wordCount }} words</span
            >
            <span class="metric-caption">
              {{
                t("toolsWordCounter.captionLongestBy", {
                  author: analysis.longestMessage.author,
                  words: analysis.longestMessage.wordCount,
                })
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Top Words Pills Cloud -->
      <div
        v-if="analysis.topWords && analysis.topWords.length"
        class="top-words-card"
      >
        <div class="card-header">
          <h3 class="card-title">{{ t("toolsWordCounter.topWordsTitle") }}</h3>
          <span class="mono-label card-subtitle">{{
            t("toolsWordCounter.topWordsSubtitle")
          }}</span>
        </div>
        <div class="words-pills">
          <div
            v-for="(item, idx) in analysis.topWords"
            :key="item.word"
            class="word-pill"
          >
            <span class="pill-rank mono-label">#{{ idx + 1 }}</span>
            <span class="pill-word">{{ item.word }}</span>
            <span class="pill-count mono-label">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- Participant Vocabulary Breakdown Table -->
      <div class="participants-section mt-6">
        <div class="section-header">
          <h3 class="section-title">
            {{ t("toolsWordCounter.participantsTitle") }}
          </h3>
          <span class="mono-label section-tag">
            {{
              t("toolsWordCounter.participantsCount", {
                count: analysis.participants.length,
              })
            }}
          </span>
        </div>

        <div class="table-container">
          <table class="participants-table">
            <thead>
              <tr>
                <th>{{ t("toolsWordCounter.colParticipant") }}</th>
                <th>{{ t("toolsWordCounter.colWords") }}</th>
                <th>{{ t("toolsWordCounter.colUniqueWords") }}</th>
                <th>{{ t("toolsWordCounter.colAvgWords") }}</th>
                <th>{{ t("toolsWordCounter.colShare") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in analysis.participants" :key="p.name">
                <td class="font-weight-bold name-cell">
                  <span class="avatar-circle">{{ p.name.charAt(0) }}</span>
                  {{ p.name }}
                </td>
                <td class="mono-cell font-weight-bold">
                  {{ p.wordCount.toLocaleString() }}
                </td>
                <td class="mono-cell">
                  {{ p.uniqueWordCount.toLocaleString() }}
                </td>
                <td class="mono-cell">{{ p.avgWordsPerMessage }}</td>
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
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </LandingSection>

    <!-- Conversion Hook (Dark Landing Section) -->
    <LandingSection
      theme="dark"
      :eyebrow="t('toolsWordCounter.hookEyebrow')"
      :title="t('toolsWordCounter.hookTitle')"
      :text="t('toolsWordCounter.hookText')"
    >
      <LandingCards :items="hookFeatures" />
      <div class="hook-actions">
        <LandingButton :to="localePath({ path: '/', hash: '#results' })">
          {{ t("toolsWordCounter.hookButton") }}
        </LandingButton>
        <p class="hook-note">
          {{ t("toolsWordCounter.hookNote") }}
        </p>
      </div>
    </LandingSection>

    <!-- Step-by-Step Guide -->
    <LandingSection
      theme="light"
      :eyebrow="t('toolsWordCounter.stepsEyebrow')"
      :title="t('toolsWordCounter.stepsTitle')"
    >
      <LandingSteps :steps="exportSteps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          {{ t("toolsWordCounter.guideLink") }} →
        </NuxtLink>
      </p>
    </LandingSection>

    <!-- Frequently Asked Questions -->
    <LandingSection theme="white" :title="t('toolsWordCounter.faqTitle')">
      <LandingFaq :items="faqItems" />
    </LandingSection>

    <!-- Final Bottom CTA -->
    <LandingCta
      :title="t('toolsWordCounter.ctaTitle')"
      :cta-text="t('toolsWordCounter.ctaButton')"
      cta-to="#dropzone-slot"
      :note="t('toolsWordCounter.ctaNote')"
      :disclaimer="t('toolsWordCounter.disclaimer')"
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

// The last crumb is the tool's name from the shared catalogue
// (composables/useSiteNav.ts), the same string the /tools index, the footer
// and the header use. Each page used to name itself differently here.
const breadcrumbs = computed(() => [
  { label: "WhatsAnalyze", to: localePath("/") },
  { label: t("toolsHub.headerTools"), to: localePath("/tools") },
  { label: t("toolsHub.toolVocabularyTitle") },
]);

useSeoMeta({
  title: () => t("toolsWordCounter.seoTitle"),
  description: () => t("toolsWordCounter.seoDescription"),
  ogTitle: () => t("toolsWordCounter.ogTitle"),
  ogDescription: () => t("toolsWordCounter.ogDescription"),
  ogType: "website",
  ogUrl: "https://www.whatsanalyze.com/tools/word-counter",
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
    title: t("toolsWordCounter.step1Title"),
    text: t("toolsWordCounter.step1Text"),
  },
  {
    title: t("toolsWordCounter.step2Title"),
    text: t("toolsWordCounter.step2Text"),
  },
  {
    title: t("toolsWordCounter.step3Title"),
    text: t("toolsWordCounter.step3Text"),
  },
]);

const faqItems = computed(() => [
  {
    q: t("toolsWordCounter.faq1Q"),
    a: t("toolsWordCounter.faq1A"),
  },
  {
    q: t("toolsWordCounter.faq2Q"),
    a: t("toolsWordCounter.faq2A"),
  },
  {
    q: t("toolsWordCounter.faq3Q"),
    a: t("toolsWordCounter.faq3A"),
  },
  {
    q: t("toolsWordCounter.faq4Q"),
    a: t("toolsWordCounter.faq4A"),
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
            name: t("toolsWordCounter.seoTitle"),
            operatingSystem: "All (Web-based)",
            applicationCategory: "UtilitiesApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            description: t("toolsWordCounter.seoDescription"),
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
@include wa-metric-cards;

.top-words-card {
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1.4rem, 3vw, 2rem);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
}

.words-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.word-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.45rem 0.85rem;
  border-radius: 30px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }
}

.pill-rank {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 700;
}

.pill-word {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.pill-count {
  font-size: 0.75rem;
  background: #e2e8f0;
  padding: 2px 7px;
  border-radius: 12px;
  color: #475569;
}

.participants-section {
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1.4rem, 3vw, 2rem);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

@include wa-participants-table(#a855f7, rgba(168, 85, 247, 0.14));

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
