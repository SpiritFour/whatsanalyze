<template>
  <article>
    <div class="text-h1">{{ page.title }}</div>
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
