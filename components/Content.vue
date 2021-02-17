<template>
  <article>
    <h1>{{ page.title }}</h1>
    <nuxt-content :document="page" />
  </article>
</template>

<script>
export default {
  props: ["page"],
};
</script>

<style scoped>
.nuxt-content h1 {
  /* my custom h1 style */
}
</style>
