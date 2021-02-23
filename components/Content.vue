<template>
  <article class="article px-10">
    <div class="text-center text-h2 py-10">{{ page.title }}</div>
    <!-- toc -->
    <div class="toc">
      <ol>
        <li v-for="heading in page.toc" :key="heading.id">
          <a :href="'#' + heading.id">
            {{ heading.text }}
          </a>
        </li>
      </ol>
    </div>
    <!-- main content -->
    <nuxt-content :document="page" class="py-10" />
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
}

.nuxt-content,
.toc {
  a:visited {
    color: black;
  }

  a:hover {
    color: $c-blue-accent !important;
  }

  a:link {
    color: black;
    text-decoration: underline !important;
  }

  h2 {
    padding-top: 0.4em;
    padding-bottom: 0.4em;
    font-size: 3rem !important;
    font-weight: 400;
    line-height: 3.125rem;
    letter-spacing: normal !important;
    font-family: "Roboto", sans-serif !important;
  }

  h3 {
    padding-top: 1em;
    padding-bottom: 0.4em;
    font-size: 1.5rem !important;
    font-weight: 400;
    line-height: 2rem;
    letter-spacing: normal !important;
    font-family: "Roboto", sans-serif !important;
  }
}
</style>
