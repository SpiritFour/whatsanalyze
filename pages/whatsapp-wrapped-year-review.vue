<template>
  <div class="whatsapp-wrapped">
    <header class="hero-section">
      <div class="container">
        <h1>🎉 {{ $t("wrapped.heroTitle", { currentYear }) }} 🎉</h1>
        <p>{{ $t("wrapped.heroSubtitle") }}</p>
        <p>
          <strong>{{ $t("wrapped.analyzeSafely") }}</strong>
        </p>
        <button class="cta-button" @click="goToHome">
          {{ $t("wrapped.ctaButton") }}
        </button>
      </div>
    </header>

    <section class="features-section">
      <div class="container">
        <h2>{{ $t("wrapped.featuresTitle") }}</h2>
        <ul>
          <li>{{ $t("wrapped.featuresList.topChatters") }}</li>
          <li>{{ $t("wrapped.featuresList.peakTimes") }}</li>
          <li>{{ $t("wrapped.featuresList.mostUsedEmojis") }}</li>
          <li>{{ $t("wrapped.featuresList.messageInsights") }}</li>
          <li>{{ $t("wrapped.featuresList.groupChats") }}</li>
        </ul>
      </div>
    </section>

    <section ref="ctaSection" class="cta-section">
      <div class="container">
        <h2>{{ $t("wrapped.ctaSectionTitle") }}</h2>
        <p>{{ $t("wrapped.ctaSectionText") }}</p>
      </div>
    </section>

    <section class="fun-facts-section">
      <div class="container">
        <h2>{{ $t("wrapped.funFactsTitle") }}</h2>
        <p>{{ $t("wrapped.funFactsIntro") }}</p>
        <ul>
          <li>{{ $t("wrapped.funFactsList.longestChat") }}</li>
          <li>{{ $t("wrapped.funFactsList.topEmoji", { currentYear }) }}</li>
          <li>{{ $t("wrapped.funFactsList.busiestDay") }}</li>
        </ul>
      </div>
    </section>

    <section class="testimonials-section">
      <div class="container">
        <h2>{{ $t("wrapped.ctaSectionTitle") }}</h2>
        <div class="testimonial">
          <blockquote>{{ $t("wrapped.testimonial1") }}</blockquote>
          <cite>– Emily R.</cite>
        </div>
        <div class="testimonial">
          <blockquote>{{ $t("wrapped.testimonial2") }}</blockquote>
          <cite>– Mark L.</cite>
        </div>
      </div>
    </section>

    <section id="how-to-export" class="how-to-section">
      <div class="container">
        <h2>{{ $t("wrapped.howToExportTitle") }}</h2>
        <div class="steps">
          <h3>📱 {{ $t("wrapped.howToExport.iPhoneTitle") }}</h3>
          <ol>
            <li>{{ $t("wrapped.howToExport.iPhoneStep1") }}</li>
            <li>{{ $t("wrapped.howToExport.iPhoneStep2") }}</li>
            <li>{{ $t("wrapped.howToExport.iPhoneStep3") }}</li>
          </ol>
          <h3>📱 {{ $t("wrapped.howToExport.androidTitle") }}</h3>
          <ol>
            <li>{{ $t("wrapped.howToExport.androidStep1") }}</li>
            <li>{{ $t("wrapped.howToExport.androidStep2") }}</li>
            <li>{{ $t("wrapped.howToExport.androidStep3") }}</li>
          </ol>
        </div>
        <ExportExplainer class="mt-10" cta="exportAsPDF" to="/" />
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentYear: new Date().getFullYear(), // Dynamically set the current year
    };
  },
  methods: {
    goToHome() {
      window.location.href = `https://wrapped.whatsanalyze.com/${this.$i18n.locale}`;
    },
  },
};
</script>

<style scoped>
/* General Styles */
.whatsapp-wrapped {
  width: 100%;
  margin: 0 auto;
}

.container {
  max-width: 960px;
  margin: auto;
  padding: 20px;
}
/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #25d366, #128c7e);
  color: white;
  text-align: center;
  padding: 20px 20px;
}

.hero-section h1 {
  font-size: 2.5rem;
}

.cta-button {
  background: #fff;
  color: #128c7e;
  border: none;
  padding: 10px 20px;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 20px;
  border-radius: 5px;
}

.cta-button:hover {
  background: #ddd;
}
</style>
