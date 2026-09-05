<template>
  <div class="landing-page">
    <LandingHero
      eyebrow="WhatsApp Tools & Utilities"
      title="Single-Purpose Tools for Your WhatsApp Chats"
      subtitle="Fast, focused, client-side utilities. Answer specific questions about your conversations with zero server upload and complete privacy."
      cta-text="Open Inactivity Tracker"
      :cta-to="localePath('/tools/inactivity')"
      note="100% client-side · Zero server upload · Free & open source"
    >
      <div class="tools-hero-preview">
        <div class="tools-hero-card">
          <div class="tools-hero-card__header">
            <span class="tools-hero-card__badge">Live Micro-Tool</span>
            <span class="tools-hero-card__dot"></span>
          </div>
          <h3 class="tools-hero-card__title">Who Texted Last?</h3>
          <p class="tools-hero-card__desc">
            Calculate elapsed silence duration, turn-taking reply latencies, and
            discover the longest conversation gaps in your chat.
          </p>
          <div class="tools-hero-card__action">
            <LandingButton :to="localePath('/tools/inactivity')">
              Try Inactivity Tracker →
            </LandingButton>
          </div>
        </div>
      </div>
    </LandingHero>

    <!-- Section 1: The Tools Grid -->
    <LandingSection
      theme="light"
      eyebrow="Available & Upcoming Tools"
      title="Choose What You Want to Measure"
      text="Every tool runs directly in your browser. No registration, no data uploaded to any server."
    >
      <LandingCards :items="toolsList" />
    </LandingSection>

    <!-- Section 2: Why Client-Side Tools? (Pillars) -->
    <LandingSection
      theme="white"
      eyebrow="Private By Design"
      title="Why Local-Only Chat Tools Matter"
      text="Your personal conversations are sensitive. That's why we never transmit your data across external networks."
    >
      <LandingCards :items="pillars" />
    </LandingSection>

    <!-- Section 3: 3 Steps to Use -->
    <LandingSection
      theme="light"
      eyebrow="How It Works"
      title="From Chat Export to Insights in Seconds"
    >
      <LandingSteps :steps="steps" />
      <p class="landing-page__guide-link">
        <NuxtLink :to="localePath('how-to-export-your-whatsapp-chat')">
          Detailed WhatsApp Export Guide →
        </NuxtLink>
      </p>
    </LandingSection>

    <!-- Section 4: Bottom CTA -->
    <LandingCta
      title="Prefer the Full Picture in One Dashboard?"
      cta-text="Launch Full WhatsApp Analyzer"
      :cta-to="localePath('/')"
      note="Analyze all charts, word clouds, wrapped stories, and export beautiful PDF books."
      disclaimer="WhatsAnalyze is an independent open-source project and is not affiliated with, endorsed by, or sponsored by WhatsApp or Meta."
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const localePath = useLocalePath();

// SEO Metadata
useSeoMeta({
  title: "WhatsApp Tools & Utilities Suite | WhatsAnalyze",
  description:
    "Explore individual, fast, and 100% private WhatsApp chat tools. From inactivity tracking and message counting to response latencies — processed entirely in your browser.",
  ogTitle: "WhatsApp Tools & Utilities Suite | WhatsAnalyze",
  ogDescription:
    "Single-purpose, fast WhatsApp tools. Check who texted last, count messages, and inspect silence gaps without uploading data.",
  ogType: "website",
  ogUrl: "https://www.whatsanalyze.com/tools",
});

// JSON-LD ItemList Schema
useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "WhatsAnalyze WhatsApp Tools",
        description: "Collection of client-side WhatsApp utility tools.",
        url: "https://www.whatsanalyze.com/tools",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: [
            {
              "@type": "SoftwareApplication",
              position: 1,
              name: "WhatsApp Inactivity & Last Message Tracker",
              url: "https://www.whatsanalyze.com/tools/inactivity",
              applicationCategory: "UtilitiesApplication",
            },
          ],
        },
      }),
    },
  ],
});

const toolsList = computed(() => [
  {
    icon: "mdi-timer-sand",
    title: "Inactivity & Last Message Tracker",
    text:
      "Find out who sent the last message, calculate elapsed silence duration, measure reply latencies, and pinpoint historical chat gaps.",
    to: localePath("/tools/inactivity"),
    linkText: "Open Tool",
  },
  {
    icon: "mdi-counter",
    title: "Message & Line Counter",
    text:
      "Count raw lines, message volume distribution per person, and speech shares in 1-on-1 and group chats.",
    linkText: "Coming Soon",
  },
  {
    icon: "mdi-format-letter-case",
    title: "Word & Vocabulary Counter",
    text:
      "Discover total word counts, average sentence lengths, and vocabulary richness across your conversations.",
    linkText: "Coming Soon",
  },
  {
    icon: "mdi-clock-time-four-outline",
    title: "Peak Chat Hours & Heatmap",
    text:
      "Analyze when conversation activity peaks throughout 24 hours. Compare day vs night talk patterns.",
    linkText: "Coming Soon",
  },
]);

const pillars = computed(() => [
  {
    icon: "mdi-cellphone-lock",
    title: "100% In-Browser Privacy",
    text:
      "No chat text, timestamps, or media files are ever transmitted to a server. All computation happens locally in your device's memory.",
  },
  {
    icon: "mdi-lightning-bolt-outline",
    title: "Zero Setup, Instant Results",
    text:
      "No account registration, no app installation. Just drop your WhatsApp export file and view metrics in milliseconds.",
  },
  {
    icon: "mdi-lock-open-outline",
    title: "Open Source & Verifiable",
    text:
      "Transparent and independently auditable code on GitHub. Your private communications stay completely in your control.",
  },
]);

const steps = computed(() => [
  {
    title: "Export Your WhatsApp Chat",
    text:
      "Export any 1-on-1 or group chat without media from WhatsApp on your iPhone or Android phone.",
  },
  {
    title: "Choose a Micro-Tool",
    text:
      "Select the specific question you want answered — inactivity, message count, or response latency.",
  },
  {
    title: "Get Instant Private Answers",
    text:
      "Inspect your metrics immediately, or seamlessly transition to the full analyzer for deep analytics.",
  },
]);
</script>

<style lang="scss" scoped>
.tools-hero-preview {
  max-width: 520px;
  margin: 0 auto;
}

.tools-hero-card {
  background: #ffffff;
  color: #1d1d1f;
  border-radius: 20px;
  padding: clamp(1.6rem, 4vw, 2.4rem);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
  text-align: left;
}

.tools-hero-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.tools-hero-card__badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 3px 10px;
  border-radius: 6px;
}

.tools-hero-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00e676;
  box-shadow: 0 0 8px #00e676;
}

.tools-hero-card__title {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.6rem;
  color: #0f172a;
}

.tools-hero-card__desc {
  font-size: 0.95rem;
  line-height: 1.55;
  color: rgba(29, 29, 31, 0.68);
  margin: 0 0 1.6rem;
}

.tools-hero-card__action {
  text-align: right;
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
