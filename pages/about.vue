<template>
  <div>
    <LandingHero
      :breadcrumbs="[
        { label: 'WhatsAnalyze', to: localePath('/') },
        { label: $t('about') },
      ]"
      :title="$t('about')"
    />
    <About />
  </div>
</template>

<script>
export default {
  name: "about.vue",
  setup() {
    return { localePath: useLocalePath() };
  },
};
</script>

<style scoped></style>
