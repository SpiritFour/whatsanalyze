<template>
  <div class="landing-quotes">
    <figure v-for="quote in quotes" :key="quote.text" class="landing-quote">
      <blockquote class="landing-quote__text">“{{ quote.text }}”</blockquote>
      <figcaption class="landing-quote__attribution">
        — {{ quote.attribution }}
      </figcaption>
    </figure>
  </div>
</template>

<script>
export default {
  name: "LandingQuotes",
  props: {
    // [{ text, attribution }]
    quotes: { type: Array, required: true },
  },
};
</script>

<style lang="scss" scoped>
.landing-quotes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
  margin-top: clamp(2.2rem, 5vw, 3.6rem);
  text-align: left;
}

.landing-quote {
  background: var(--landing-card-bg, #ffffff);
  border-radius: 20px;
  padding: 2rem 1.8rem;
  box-shadow: var(--landing-card-shadow, none);
  margin: 0;
}

.landing-quote__text {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--landing-card-fg, #1d1d1f);
  margin: 0;
}

.landing-quote__attribution {
  margin-top: 1.2rem;
  font-size: 0.95rem;
  color: var(--landing-card-muted, rgba(29, 29, 31, 0.68));
}
</style>
