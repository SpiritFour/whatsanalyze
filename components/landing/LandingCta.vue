<template>
  <LandingSection theme="dark">
    <h2 class="landing-cta__title">{{ title }}</h2>
    <div class="landing-cta__actions">
      <LandingButton :to="ctaTo">{{ ctaText }}</LandingButton>
    </div>
    <p v-if="note" class="landing-cta__note">{{ note }}</p>
    <p v-if="disclaimer" class="landing-cta__disclaimer">{{ disclaimer }}</p>
  </LandingSection>
</template>

<script>
export default {
  name: "LandingCta",
  props: {
    title: { type: String, required: true },
    ctaText: { type: String, required: true },
    ctaTo: { type: [String, Object], default: "/" },
    note: { type: String, default: "" },
    disclaimer: { type: String, default: "" },
  },
};
</script>

<style lang="scss" scoped>
.landing-cta__title {
  font-size: clamp(2.2rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.02em;
  max-width: 20ch;
  margin: 0 auto;
}

.landing-cta__actions {
  margin-top: 2.2rem;
}

.landing-cta__note {
  margin-top: 1.2rem;
  font-size: 0.95rem;
  color: rgba(245, 245, 247, 0.55);
}

.landing-cta__disclaimer {
  margin: clamp(2.5rem, 6vw, 4rem) auto 0;
  max-width: 40rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: rgba(245, 245, 247, 0.4);
}
</style>
