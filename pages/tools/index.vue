<template>
  <div class="tools-hub-page">
    <!-- Breadcrumb Bar -->
    <nav class="breadcrumb-nav">
      <NuxtLink to="/" class="breadcrumb-link">WhatsAnalyze</NuxtLink>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Tools Suite</span>
    </nav>

    <!-- Hero Header -->
    <header class="hub-hero">
      <div class="hub-badge mono-label">
        <span class="badge-dot"></span>
        MICRO-UTILITY PLATFORM
      </div>

      <h1 class="hub-title">WhatsApp Tools & Analytics Suite</h1>

      <p class="hub-intro">
        Focused, fast, client-side tools extracted from the WhatsAnalyze engine.
        Answer specific questions about your conversations with zero server
        transmission.
      </p>
    </header>

    <!-- Tools Grid (Apple Style Cards) -->
    <div class="tools-grid">
      <!-- Inactivity Tracker (Active) -->
      <NuxtLink to="/tools/inactivity" class="tool-card active-card">
        <div class="tool-card-header">
          <div class="tool-icon-wrapper active-icon">
            <v-icon color="#21a68d" size="28">mdi-timer-sand</v-icon>
          </div>
          <span class="status-chip live-chip">
            <span class="pulse-chip-dot"></span>
            LIVE
          </span>
        </div>

        <div class="tool-card-body">
          <h2 class="tool-card-title">Inactivity & Last Message Tracker</h2>
          <p class="tool-card-desc">
            Identify who sent the last message, calculate elapsed silence
            duration, measure reply latencies, and pinpoint historical
            conversation gaps.
          </p>
        </div>

        <div class="tool-card-footer">
          <div class="metrics-tags">
            <span class="mono-label tag">LAST SENDER</span>
            <span class="mono-label tag">SILENCE GAPS</span>
            <span class="mono-label tag">REPLY LATENCY</span>
          </div>
          <span class="arrow-cta">
            Open Tool <v-icon size="16">mdi-arrow-right</v-icon>
          </span>
        </div>
      </NuxtLink>

      <!-- Message & Line Counter (Teaser / Coming Soon) -->
      <div class="tool-card upcoming-card">
        <div class="tool-card-header">
          <div class="tool-icon-wrapper">
            <v-icon color="#60d8bd" size="28">mdi-counter</v-icon>
          </div>
          <span class="status-chip upcoming-chip">UPCOMING</span>
        </div>

        <div class="tool-card-body">
          <h2 class="tool-card-title">Message & Line Counter</h2>
          <p class="tool-card-desc">
            Count raw lines, message volume distribution per person, and speech
            shares. Compare who talks more in 1-on-1 and group chats.
          </p>
        </div>

        <div class="tool-card-footer">
          <div class="metrics-tags">
            <span class="mono-label tag">TOTAL LINES</span>
            <span class="mono-label tag">SPEECH SHARE</span>
          </div>
          <span class="in-development mono-label">In Development</span>
        </div>
      </div>

      <!-- Word Counter (Teaser) -->
      <div class="tool-card upcoming-card">
        <div class="tool-card-header">
          <div class="tool-icon-wrapper">
            <v-icon color="#ffd45c" size="28">mdi-format-letter-case</v-icon>
          </div>
          <span class="status-chip upcoming-chip">UPCOMING</span>
        </div>

        <div class="tool-card-body">
          <h2 class="tool-card-title">Word & Vocabulary Counter</h2>
          <p class="tool-card-desc">
            Discover total word counts, average sentence lengths, vocabulary
            richness, and identify the longest messages ever sent.
          </p>
        </div>

        <div class="tool-card-footer">
          <div class="metrics-tags">
            <span class="mono-label tag">WORD COUNT</span>
            <span class="mono-label tag">VOCABULARY</span>
          </div>
          <span class="in-development mono-label">In Development</span>
        </div>
      </div>

      <!-- Activity Heatmap (Teaser) -->
      <div class="tool-card upcoming-card">
        <div class="tool-card-header">
          <div class="tool-icon-wrapper">
            <v-icon color="#ff8f00" size="28"
              >mdi-clock-time-four-outline</v-icon
            >
          </div>
          <span class="status-chip upcoming-chip">UPCOMING</span>
        </div>

        <div class="tool-card-body">
          <h2 class="tool-card-title">Peak Chat Hours & Heatmap</h2>
          <p class="tool-card-desc">
            Analyze when conversation activity peaks throughout 24 hours.
            Compare day vs night talk patterns and weekend surges.
          </p>
        </div>

        <div class="tool-card-footer">
          <div class="metrics-tags">
            <span class="mono-label tag">HOURLY HEATMAP</span>
            <span class="mono-label tag">NIGHT OWLS</span>
          </div>
          <span class="in-development mono-label">In Development</span>
        </div>
      </div>
    </div>

    <!-- The Full Suite Callout Banner -->
    <section class="full-suite-banner">
      <div class="banner-content">
        <span class="banner-badge mono-label">ALL-IN-ONE ENGINE</span>
        <h3 class="banner-title">Prefer the full picture in one dashboard?</h3>
        <p class="banner-subtitle">
          WhatsAnalyze provides all these metrics together — including
          interactive graphs, emoji clouds, and a downloadable PDF book.
        </p>
      </div>
      <NuxtLink to="/" class="btn-main-dashboard">
        Launch Full Analyzer
        <v-icon size="18" class="ml-2">mdi-arrow-right</v-icon>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
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
      children: JSON.stringify({
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
</script>

<style scoped lang="scss">
.tools-hub-page {
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

.hub-hero {
  text-align: center;
  margin-bottom: 48px;
}

.hub-badge {
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

.hub-title {
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

.hub-intro {
  font-size: 1.15rem;
  color: #a0aec0;
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.6;
}

.mono-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 56px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.tool-card {
  position: relative;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 24px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &.active-card {
    border-color: rgba(33, 166, 141, 0.25);
    background: linear-gradient(
      145deg,
      rgba(18, 28, 35, 0.7),
      rgba(12, 20, 26, 0.8)
    );

    &:hover {
      border-color: #21a68d;
      transform: translateY(-3px);
      box-shadow: 0 20px 40px -15px rgba(33, 166, 141, 0.3);
    }
  }

  &.upcoming-card {
    opacity: 0.75;
  }
}

.tool-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tool-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;

  &.active-icon {
    background: rgba(33, 166, 141, 0.12);
    border: 1px solid rgba(33, 166, 141, 0.25);
  }
}

.status-chip {
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 100px;

  &.live-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 230, 118, 0.1);
    color: #00e676;
    border: 1px solid rgba(0, 230, 118, 0.3);
  }

  &.upcoming-chip {
    background: rgba(255, 255, 255, 0.05);
    color: #718096;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.pulse-chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #00e676;
  box-shadow: 0 0 6px #00e676;
}

.tool-card-title {
  color: #ffffff;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}

.tool-card-desc {
  color: #a0aec0;
  font-size: 0.94rem;
  line-height: 1.55;
  margin-bottom: 24px;
}

.tool-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.metrics-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: rgba(255, 255, 255, 0.04);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.68rem;
  color: #718096;
}

.arrow-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #60d8bd;
  font-size: 0.88rem;
  font-weight: 600;
}

.in-development {
  color: #718096;
  font-size: 0.74rem;
}

.full-suite-banner {
  background: linear-gradient(
    135deg,
    rgba(20, 32, 40, 0.9),
    rgba(10, 18, 23, 0.95)
  );
  border: 1px solid rgba(33, 166, 141, 0.2);
  border-radius: 24px;
  padding: 36px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.banner-badge {
  color: #60d8bd;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  display: block;
}

.banner-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.banner-subtitle {
  color: #a0aec0;
  font-size: 0.92rem;
  max-width: 540px;
  margin: 0;
  line-height: 1.5;
}

.btn-main-dashboard {
  display: inline-flex;
  align-items: center;
  background: #21a68d;
  color: #ffffff;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 14px;
  text-decoration: none;
  box-shadow: 0 8px 20px -4px rgba(33, 166, 141, 0.4);
  transition: all 0.2s ease;

  &:hover {
    background: #2ab89c;
    transform: translateY(-1px);
    box-shadow: 0 12px 25px -4px rgba(33, 166, 141, 0.55);
  }
}
</style>
