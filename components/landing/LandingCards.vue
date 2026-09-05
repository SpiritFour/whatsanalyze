<template>
  <div class="landing-cards">
    <template v-for="item in items" :key="item.title">
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="landing-card landing-card--link"
      >
        <v-icon v-if="item.icon" class="landing-card__icon" size="32">
          {{ item.icon }}
        </v-icon>
        <h3 class="landing-card__title">{{ item.title }}</h3>
        <p class="landing-card__text">{{ item.text }}</p>
        <span class="landing-card__more">
          {{ item.linkText || "Open" }}
          <v-icon size="16">mdi-arrow-right</v-icon>
        </span>
      </NuxtLink>

      <div v-else class="landing-card">
        <v-icon v-if="item.icon" class="landing-card__icon" size="32">
          {{ item.icon }}
        </v-icon>
        <h3 class="landing-card__title">{{ item.title }}</h3>
        <p class="landing-card__text">{{ item.text }}</p>
        <span v-if="item.linkText" class="landing-card__status">
          {{ item.linkText }}
        </span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "LandingCards",
  props: {
    // [{ icon, title, text, to?, linkText? }]
    items: { type: Array, required: true },
  },
};
</script>

<style lang="scss" scoped>
.landing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.2rem;
  margin-top: clamp(2.2rem, 5vw, 3.6rem);
  text-align: left;
}

.landing-card {
  background: var(--landing-card-bg, #ffffff);
  color: var(--landing-card-fg, #1d1d1f);
  border-radius: 20px;
  padding: 1.8rem 1.6rem;
  box-shadow: var(--landing-card-shadow, none);
  text-decoration: none;
  display: flex;
  flex-direction: column;
}
.landing-card--link {
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.09);
  }
}

.landing-card__icon {
  color: $c-blue-accent;
  margin-bottom: 1rem;
}

.landing-card__title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 0.6rem;
}

.landing-card__text {
  font-size: 1rem;
  line-height: 1.55;
  color: var(--landing-card-muted, rgba(29, 29, 31, 0.68));
  margin: 0;
}

.landing-card__more {
  margin-top: auto;
  padding-top: 1rem;
  font-weight: 600;
  color: $c-blue-accent;
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
}

.landing-card__status {
  margin-top: auto;
  padding-top: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--landing-card-muted, rgba(29, 29, 31, 0.45));
}
</style>
