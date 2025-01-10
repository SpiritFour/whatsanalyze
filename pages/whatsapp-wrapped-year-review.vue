<template>
  <div class="whatsapp-wrapped">
    <header class="hero-section">
      <div class="container">
        <h1>🎉 WhatsApp Wrapped 2025 🎉</h1>
        <p>
          Your WhatsApp year, wrapped up in stunning insights! Discover your top
          chat buddies, most active times, and fun facts about your
          conversations.
        </p>
        <p>
          <strong>Analyze your chats safely:</strong> All processing happens
          locally in your browser—your data never leaves your device.
        </p>
        <button class="cta-button" @click="goToHome">Get Started</button>
      </div>
    </header>

    <section class="features-section">
      <div class="container">
        <h2>What’s in Your WhatsApp Wrapped?</h2>
        <ul>
          <li>
            📊 <strong>Top Chatters:</strong> See who you talked to the most
            this year.
          </li>
          <li>
            ⏰ <strong>Peak Times:</strong> Discover when you're most active.
          </li>
          <li>
            😂 <strong>Most Used Emojis:</strong> Find out which emojis you just
            can't stop using.
          </li>
          <li>
            💬 <strong>Message Insights:</strong> View message counts, word
            counts, and patterns over time.
          </li>
          <li>
            👥 <strong>Group Chats:</strong> Dive into group dynamics and
            uncover who's most vocal.
          </li>
        </ul>
      </div>
    </section>

    <section ref="ctaSection" class="cta-section">
      <div class="container">
        <h2>Discover Your WhatsApp Story</h2>
        <p>
          Curious about who you’ve messaged the most this year or what your top
          emoji is? Uncover fun facts, hidden patterns, and engaging insights
          about your WhatsApp chats with just a click.
        </p>
        <Cta
          to="/"
          class="cta-section py-5"
          title="WhatsApp Wrapped 2025"
          button-txt="Create my WhatsApp Wrapped Now"
          text="Dive into your WhatsApp Wrapped and turn your messages into a beautiful, data-driven journey. Don’t miss out!"
        />
      </div>
    </section>

    <section class="fun-facts-section">
      <div class="container">
        <h2>Fun Facts About WhatsApp Chats</h2>
        <p>
          Did you know that the average person sends over 42 messages a day on
          WhatsApp? Or that emojis make up over 20% of all messages?
        </p>
        <ul>
          <li>
            🎉 Longest group chat conversation lasted over 36 hours nonstop!
          </li>
          <li>
            😂 Most used emoji of 2025? The laughing face with tears of joy!
          </li>
          <li>📅 The busiest WhatsApp day of the year: New Year's Eve.</li>
        </ul>
      </div>
    </section>

    <section class="testimonials-section">
      <div class="container">
        <h2>What People Are Saying</h2>
        <div class="testimonial">
          <blockquote>
            "WhatsApp Wrapped gave me a whole new perspective on my
            conversations. I was surprised to see my most active times and who I
            talked to the most. It's fun and insightful!"
          </blockquote>
          <cite>– Emily R.</cite>
        </div>
        <div class="testimonial">
          <blockquote>
            "I loved the emoji stats! It’s a fun way to reflect on my chats and
            see how my relationships evolved over the year."
          </blockquote>
          <cite>– Mark L.</cite>
        </div>
      </div>
    </section>

    <section id="how-to-export" class="how-to-section">
      <div class="container">
        <h2>How to Export Your WhatsApp Chat</h2>
        <div class="steps">
          <h3>📱 On iPhone:</h3>
          <ol>
            <li>
              Open WhatsApp and go to the chat or group chat you want to export.
            </li>
            <li>
              Tap the chat name at the top, scroll down, and select
              <strong>Export Chat</strong>.
            </li>
            <li>
              Choose <strong>Without Media</strong> and save the file locally.
            </li>
          </ol>
          <h3>📱 On Android:</h3>
          <ol>
            <li>
              Open WhatsApp and go to the chat or group chat you want to export.
            </li>
            <li>
              Tap the three dots at the top-right corner, then
              <strong>More</strong> > <strong>Export Chat</strong>.
            </li>
            <li>
              Choose <strong>Without Media</strong> and save the file to your
              device.
            </li>
          </ol>
        </div>
        <ExportExplainer class="mt-10" cta="exportAsPDF" to="/" />
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <p>
          Built with ❤️ by WhatsAnalyze |
          <a href="#privacy-policy">Privacy Policy</a> |
          <a href="#terms">Terms</a>
        </p>
        <p>
          Open-source project on
          <a href="https://github.com" target="_blank">GitHub</a>.
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  methods: {
    goToHome() {
      this.$router.push("/"); // Navigate to the home page
    },
  },
};
</script>

<style scoped>
/* General Styles */
body {
  font-family: "Arial", sans-serif;
  margin: 0;
  padding: 0;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #25d366, #128c7e);
  color: white;
  text-align: center;
  padding: 50px 20px;
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

/* Upload Section */
.upload-box {
  border: 2px dashed #ccc;
  text-align: center;
  padding: 20px;
  margin: 20px 0;
}

.upload-box input {
  display: block;
  margin: 10px auto;
  font-size: 1rem;
}

/* Footer */
.footer {
  text-align: center;
  background: #f4f4f4;
  padding: 10px 20px;
}

.footer a {
  color: #128c7e;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}
</style>
