<template>
  <section :class="['landing-section', `landing-section--${theme}`]">
    <!--
      `landing-reveal` is the hidden half of the animation, and it is added
      here by script rather than shipped in the markup. The site is
      prerendered precisely so a page paints before its JavaScript runs, and a
      class that hides everything until mounted() gave that away again: the
      content was in the document within 400ms and invisible for three and a
      half seconds. Nothing is hidden until there is something able to show it
      again.
    -->
    <div
      ref="inner"
      class="landing-section__inner"
      :class="{ 'landing-reveal': pending, 'is-visible': visible }"
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
    /**
     * Off for sections that carry the thing the visitor came for, like the
     * chat analysis: those must be on screen the moment they render, not
     * after a scroll.
     */
    reveal: { type: Boolean, default: true },
  },
  data() {
    return {
      // Whether this section is waiting to be revealed. False until mounted
      // decides it should be, so the prerendered markup is never hidden.
      pending: false,
      visible: false,
      observer: null,
    };
  },
  mounted() {
    if (!this.reveal || !("IntersectionObserver" in window)) return;

    // A section the reader is already looking at is not animated in. Fading
    // something that is on screen means hiding it first, which is the flash
    // this whole arrangement exists to avoid.
    const box = this.$refs.inner.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;

    this.pending = true;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible = true;
          this.observer.disconnect();
        }
      },
      // Fire on the first pixel rather than on a share of the section: a
      // section taller than about seven viewports can never show 15% of
      // itself, and would stay at opacity 0 for good. Pulling the bottom of
      // the root up keeps the reveal feeling the same for short sections.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
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
  /* The min and the max were both 4rem, so this clamp could only ever return
     4rem and the 10vw never did anything. On a phone it spent 64px above the
     fold on nothing, which is most of why the first section started below it. */
  padding: clamp(2.5rem, 10vw, 4rem) 1.5rem;
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
  transition:
    opacity 0.9s ease,
    transform 0.9s ease;

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
