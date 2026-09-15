<template>
  <section :class="['landing-section', `landing-section--${theme}`]">
    <div
      ref="inner"
      class="landing-section__inner landing-reveal"
      :class="{ 'is-visible': visible }"
    >
      <p v-if="eyebrow" class="landing-section__eyebrow">{{ eyebrow }}</p>
      <h2 v-if="title" class="landing-section__title">{{ title }}</h2>
      <p v-if="text" class="landing-section__text">{{ text }}</p>
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: "LandingSection",
  props: {
    theme: {
      type: String,
      default: "light",
      validator: (value) => ["light", "dark", "white"].includes(value),
    },
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    text: { type: String, default: "" },
  },
  data() {
    return {
      visible: false,
      observer: null,
    };
  },
  mounted() {
    if (!("IntersectionObserver" in window)) {
      this.visible = true;
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible = true;
          this.observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    this.observer.observe(this.$refs.inner);
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
  },
};
</script>

<style lang="scss" scoped>
.landing-section {
  padding: clamp(4rem, 10vw, 7.5rem) 1.5rem;
  text-align: center;

  &--light {
    background: #f5f5f7;
    color: #1d1d1f;
    --landing-muted: rgba(29, 29, 31, 0.68);
    --landing-card-bg: #ffffff;
    --landing-card-fg: #1d1d1f;
    --landing-card-muted: rgba(29, 29, 31, 0.68);
    --landing-card-shadow: 0 4px 22px rgba(0, 0, 0, 0.06);
  }

  &--white {
    background: #ffffff;
    color: #1d1d1f;
    --landing-muted: rgba(29, 29, 31, 0.68);
    --landing-card-bg: #f5f5f7;
    --landing-card-fg: #1d1d1f;
    --landing-card-muted: rgba(29, 29, 31, 0.68);
    --landing-card-shadow: none;
  }

  &--dark {
    background: #0d1418;
    color: #f5f5f7;
    --landing-muted: rgba(245, 245, 247, 0.68);
    --landing-card-bg: rgba(245, 245, 247, 0.07);
    --landing-card-fg: #f5f5f7;
    --landing-card-muted: rgba(245, 245, 247, 0.68);
    --landing-card-shadow: none;
  }
}

.landing-section__inner {
  max-width: 1080px;
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

.landing-section__eyebrow {
  color: $c-blue-accent-dark;
  font-size: clamp(0.95rem, 1.5vw, 1.15rem);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1.1rem;
}

.landing-section--dark .landing-section__eyebrow {
  color: $c-blue-accent-light;
}

.landing-section__title {
  font-size: clamp(1.9rem, 4.5vw, 3.3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.015em;
  max-width: 24ch;
  margin: 0 auto;
}

.landing-section__text {
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  line-height: 1.55;
  color: var(--landing-muted);
  max-width: 44rem;
  margin: 1.4rem auto 0;
}
</style>
