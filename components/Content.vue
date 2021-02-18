<template>
  <article class="article pt-4 pb-4">
    <h1 style="font-size: 3em; margin-bottom: 1em">{{ page.title }}</h1>
    <nuxt-content :document="page" />

    <div>
      <ol>
        <li v-for="heading in page.toc" :key="heading">
          <a :href="'#' + heading.id">
            {{ heading.text }}
          </a>
        </li>
      </ol>
    </div>
  </article>
</template>

<script>
export default {
  props: ["page"],
};
</script>

<style lang="scss">
.article {
  background: $c-white;
  position: relative;
  padding: 3em;
}
.nuxt-content h1 {
  font-size: 4em;
  margin-bottom: 1em;
}
.nuxt-content h2 {
  font-size: 2em;
  margin-top: 0.7em;
  margin-bottom: 0.7em;
}
.nuxt-content h3 {
  font-size: 1.5em;
  margin-bottom: 0.7em;
  margin-top: 0.7em;
}
</style>
