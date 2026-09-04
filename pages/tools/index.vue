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
        WHATSAPP TOOLS
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
  color: #0f172a;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  margin-bottom: 32px;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #0f766e;
  }
}

.breadcrumb-separator {
  color: #4a5568;
}

.breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

.hub-hero {
  text-align: center;
  margin-bottom: 48px;
}

.hub-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 4px 14px;
  border-radius: 100px;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: #0f766e;
  font-weight: 700;
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
  color: #0f172a;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.hub-intro {
  font-size: 1.15rem;
  color: #475569;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &.active-card {
    border-color: #cbd5e1;

    &:hover {
      border-color: #21a68d;
      transform: translateY(-3px);
      box-shadow: 0 16px 32px -8px rgba(33, 166, 141, 0.2);
    }
  }

  &.upcoming-card {
    background: #f8fafc;
    opacity: 0.85;
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
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active-icon {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
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
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}

.tool-card-desc {
  color: #475569;
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
  border-top: 1px solid #f1f5f9;
}

.metrics-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.68rem;
  color: #475569;
  font-weight: 600;
}

.arrow-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #0f766e;
  font-size: 0.88rem;
  font-weight: 700;
}

.in-development {
  color: #94a3b8;
  font-size: 0.74rem;
  font-weight: 600;
}

.full-suite-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 1px solid #334155;
  border-radius: 24px;
  padding: 36px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.4);

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
  color: #cbd5e1;
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
