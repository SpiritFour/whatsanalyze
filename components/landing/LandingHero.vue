<template>
  <header class="landing-hero">
    <div class="landing-hero__inner landing-reveal" :class="{ 'is-visible': visible }">
      <p v-if="eyebrow" class="landing-hero__eyebrow">{{ eyebrow }}</p>
      <h1 class="landing-hero__title">{{ title }}</h1>
      <p v-if="subtitle" class="landing-hero__subtitle">{{ subtitle }}</p>
      <div v-if="ctaText" class="landing-hero__actions">
        <LandingButton :to="ctaTo">{{ ctaText }}</LandingButton>
      </div>
      <p v-if="note" class="landing-hero__note">{{ note }}</p>
      <div v-if="$slots.default" class="landing-hero__visual">
        <slot />
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: "LandingHero",
  props: {
    eyebrow: { type: String, default: "" },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    ctaTo: { type: [String, Object], default: "/" },
    note: { type: String, default: "" },
  },
  data() {
    return { visible: false };
  },
  mounted() {
    requestAnimationFrame(() => {
      this.visible = true;
    });
  },
};
</script>

<style lang="scss" scoped>
.landing-hero {
  background: #0d1418;
  color: #f5f5f7;
  text-align: center;
  padding: clamp(4.5rem, 12vw, 9rem) 1.5rem clamp(3rem, 8vw, 6rem);
  overflow: hidden;
}

.landing-hero__inner {
  max-width: 1000px;
  margin: 0 auto;
}

.landing-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s ease, transform 0.9s ease;

  &.is-visible {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-reveal {
    transition: none;
    opacity: 1;
    transform: none;
  }
}

.landing-hero__eyebrow {
  color: $c-blue-accent-light;
  font-size: clamp(0.95rem, 1.5vw, 1.15rem);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1.2rem;
}

.landing-hero__title {
  font-size: clamp(2.5rem, 7vw, 4.8rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 auto;
  max-width: 18ch;
}

.landing-hero__subtitle {
  font-size: clamp(1.1rem, 2.2vw, 1.45rem);
  line-height: 1.5;
  color: rgba(245, 245, 247, 0.72);
  max-width: 44rem;
  margin: 1.6rem auto 0;
}

.landing-hero__actions {
  margin-top: 2.4rem;
}

.landing-hero__note {
  margin-top: 1.2rem;
  font-size: 0.95rem;
  color: rgba(245, 245, 247, 0.55);
}

.landing-hero__visual {
  margin-top: clamp(3rem, 7vw, 5.5rem);
}
</style>
