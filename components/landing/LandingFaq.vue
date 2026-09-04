<template>
  <div class="landing-faq">
    <details v-for="item in items" :key="item.q" class="landing-faq__item">
      <summary class="landing-faq__question">
        {{ item.q }}
        <v-icon class="landing-faq__chevron" size="20">mdi-plus</v-icon>
      </summary>
      <p class="landing-faq__answer">{{ item.a }}</p>
    </details>
  </div>
</template>

<script>
export default {
  name: "LandingFaq",
  props: {
    // [{ q, a }]
    items: { type: Array, required: true },
  },
};
</script>

<style lang="scss" scoped>
.landing-faq {
  max-width: 46rem;
  margin: clamp(2.2rem, 5vw, 3.6rem) auto 0;
  text-align: left;
}

.landing-faq__item {
  border-bottom: 1px solid rgba(29, 29, 31, 0.15);
  padding: 0.4rem 0;
}

.landing-faq__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  list-style: none;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 1rem 0;

  &::-webkit-details-marker {
    display: none;
  }
}

.landing-faq__chevron {
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.landing-faq__item[open] .landing-faq__chevron {
  transform: rotate(45deg);
}

.landing-faq__answer {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--landing-muted, rgba(29, 29, 31, 0.68));
  margin: 0 0 1.2rem;
  max-width: 42rem;
}
</style>
