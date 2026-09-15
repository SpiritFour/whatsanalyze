<template>
  <ol class="landing-steps">
    <li v-for="(step, index) in steps" :key="step.title" class="landing-step">
      <span class="landing-step__number">{{ index + 1 }}</span>
      <h3 class="landing-step__title">{{ step.title }}</h3>
      <p class="landing-step__text">{{ step.text }}</p>
    </li>
  </ol>
</template>

<script>
export default {
  name: "LandingSteps",
  props: {
    // [{ title, text }]
    steps: { type: Array, required: true },
  },
};
</script>

<style lang="scss" scoped>
.landing-steps {
  list-style: none;
  padding: 0;
  margin: clamp(2.2rem, 5vw, 3.6rem) auto 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.2rem;
  text-align: left;
}

.landing-step {
  background: var(--landing-card-bg, #ffffff);
  color: var(--landing-card-fg, #1d1d1f);
  border-radius: 20px;
  padding: 1.8rem 1.6rem;
  box-shadow: var(--landing-card-shadow, none);
}

.landing-step__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: $c-blue-accent;
  color: #ffffff;
  font-weight: 700;
  margin-bottom: 1rem;
}

.landing-step__title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 0.6rem;
}

.landing-step__text {
  font-size: 1rem;
  line-height: 1.55;
  color: var(--landing-card-muted, rgba(29, 29, 31, 0.68));
  margin: 0;
}
</style>
