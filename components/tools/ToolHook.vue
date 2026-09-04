<template>
  <section class="tool-hook-section">
    <div class="iceberg-card">
      <div class="iceberg-badge">
        <span class="iceberg-dot"></span>
        <span class="mono-label">BEYOND BASIC INACTIVITY</span>
      </div>

      <h2 class="iceberg-title">
        You're seeing only
        <span class="accent-text">1% of your chat data</span>.
      </h2>
      <p class="iceberg-subtitle">
        WhatsAnalyze transforms your entire conversation into interactive
        charts, response metrics, and an annual Wrapped story. 100% private in
        your browser.
      </p>

      <!-- Feature Teaser Grid (Apple Card Grid) -->
      <div class="teaser-grid">
        <div class="teaser-card">
          <div class="teaser-icon">
            <v-icon color="#21a68d">mdi-chart-bell-curve-cumulative</v-icon>
          </div>
          <div class="teaser-content">
            <h4>24h Activity Distribution</h4>
            <p>
              Find out when you talk the most — from morning coffee chats to 2
              AM night talks.
            </p>
          </div>
        </div>

        <div class="teaser-card">
          <div class="teaser-icon">
            <v-icon color="#60d8bd">mdi-emoticon-outline</v-icon>
          </div>
          <div class="teaser-content">
            <h4>Emoji & Word Clouds</h4>
            <p>
              Discover which emojis and catchphrases define your conversation
              dynamic.
            </p>
          </div>
        </div>

        <div class="teaser-card">
          <div class="teaser-icon">
            <v-icon color="#ffd45c">mdi-lightning-bolt-outline</v-icon>
          </div>
          <div class="teaser-content">
            <h4>First Responder Dynamics</h4>
            <p>
              Detailed breakdown of who starts topics, double texts, and answers
              the fastest.
            </p>
          </div>
        </div>

        <div class="teaser-card">
          <div class="teaser-icon">
            <v-icon color="#ff8f00">mdi-party-popper</v-icon>
          </div>
          <div class="teaser-content">
            <h4>WhatsApp Wrapped Story</h4>
            <p>
              Turn your chat into an Instagram-story style retrospective to
              share with friends.
            </p>
          </div>
        </div>

        <div class="teaser-card full-width">
          <div class="teaser-icon">
            <v-icon color="#00e676">mdi-file-pdf-box</v-icon>
          </div>
          <div class="teaser-content">
            <h4>Export as Beautiful PDF Book</h4>
            <p>
              Preserve your memories with formatted chat bubbles, timestamps,
              and embedded images.
            </p>
          </div>
        </div>
      </div>

      <!-- One-Click Magnetic CTA Button -->
      <div class="hook-cta-container">
        <button type="button" class="btn-unlock-all" @click="openFullAnalysis">
          <span>Explore Complete WhatsApp Analysis</span>
          <v-icon size="20" class="ml-2">mdi-arrow-right</v-icon>
        </button>
        <span class="cta-note mono-label">
          Instant transition • No re-upload required • Free
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSharedChat } from "~/composables/useChatTool";

const router = useRouter();
const { locale } = useI18n();
const sharedChat = useSharedChat();

function openFullAnalysis() {
  const homePath = locale.value === "en" ? "/" : `/${locale.value}/`;
  // Push route to main home page with autoload flag
  router.push({
    path: homePath,
    query: { autoload: "1" },
  });
}
</script>

<style scoped lang="scss">
.tool-hook-section {
  width: 100%;
  max-width: 960px;
  margin: 48px auto 0;
}

.iceberg-card {
  position: relative;
  background: linear-gradient(
    145deg,
    rgba(14, 23, 30, 0.95),
    rgba(7, 16, 21, 0.98)
  );
  border: 1px solid rgba(33, 166, 141, 0.25);
  border-radius: 28px;
  padding: 48px 36px;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.7),
    0 0 40px rgba(33, 166, 141, 0.08);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 320px;
    height: 320px;
    background: radial-gradient(
      circle,
      rgba(33, 166, 141, 0.15) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
}

.iceberg-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(33, 166, 141, 0.12);
  border: 1px solid rgba(33, 166, 141, 0.3);
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 20px;
}

.iceberg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #21a68d;
}

.mono-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: #60d8bd;
  text-transform: uppercase;
}

.iceberg-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin-bottom: 12px;
  line-height: 1.25;

  .accent-text {
    background: linear-gradient(135deg, #60d8bd, #21a68d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.iceberg-subtitle {
  font-size: 1.05rem;
  color: #a0aec0;
  max-width: 680px;
  line-height: 1.6;
  margin-bottom: 36px;
}

.teaser-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 40px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.teaser-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 18px 20px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(33, 166, 141, 0.3);
    transform: translateY(-2px);
  }

  &.full-width {
    grid-column: 1 / -1;
  }
}

.teaser-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.teaser-content {
  h4 {
    font-size: 0.98rem;
    font-weight: 600;
    color: #f7fafc;
    margin-bottom: 4px;
  }

  p {
    font-size: 0.85rem;
    color: #a0aec0;
    line-height: 1.45;
    margin: 0;
  }
}

.hook-cta-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.btn-unlock-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #21a68d;
  color: #ffffff;
  font-size: 1.08rem;
  font-weight: 600;
  padding: 16px 36px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(33, 166, 141, 0.5);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #2ab89c;
    transform: scale(1.02);
    box-shadow: 0 15px 35px -5px rgba(33, 166, 141, 0.65);
  }
}

.cta-note {
  color: #718096;
  font-size: 0.76rem;
}
</style>
