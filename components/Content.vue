<template>
  <article class="article">
    <div class="article__inner">
      <!-- toc — only worth showing once there is something to jump between -->
      <nav v-if="toc.length > 1" class="toc" aria-label="On this page">
        <ol>
          <li v-for="heading in toc" :key="heading.id">
            <a :href="'#' + heading.id">
              {{ heading.text }}
            </a>
          </li>
        </ol>
      </nav>
      <!-- main content -->
      <ContentRenderer class="nuxt-content" :value="page" />
    </div>
  </article>
</template>

<script>
export default {
  props: ["page"],
  computed: {
    toc() {
      return this.page.body?.toc?.links || this.page.toc || [];
    },
  },
};
</script>

<style lang="scss">
// The long-form pages used to be raw Vuetify defaults — black on white, no
// measure, headings at 3rem — which is what made them read as "light mode
// inside dark chrome". They sit on the same light surface as every other
// section of the site now, under the same dark hero.
.article {
  background: $wa-surface-light;
  color: $wa-ink;
  padding: clamp(2.5rem, 6vw, 4rem) 1.5rem;
}

.article__inner {
  max-width: 46rem;
  margin: 0 auto;
}

.nuxt-content * img {
  max-width: 100%;
  border-radius: $wa-radius-lg;
  margin: 1.5rem 0;
}

.toc {
  background: $wa-surface-white;
  border: 1px solid $wa-border;
  border-radius: $wa-radius-lg;
  padding: 1.2rem 1.5rem;
  margin-bottom: 2.5rem;

  ol {
    margin: 0;
    padding-left: 1.2rem;
  }

  li {
    margin: 0.3rem 0;
  }
}

.nuxt-content,
.toc {
  a:link,
  a:visited {
    color: $wa-accent-dark;
    text-decoration: underline;
  }

  a:hover {
    color: $wa-accent;
  }

  p,
  li {
    font-size: 1.05rem;
    line-height: 1.65;
    color: $wa-ink-muted;
  }

  ul,
  ol {
    padding-left: 1.4rem;
    margin: 1rem 0;
  }

  li {
    list-style: revert;
  }

  blockquote {
    border-left: 3px solid $wa-accent;
    background: $wa-surface-white;
    border-radius: 0 $wa-radius-md $wa-radius-md 0;
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    font-style: italic;
  }

  h2 {
    font-size: clamp(1.6rem, 3.5vw, 2.2rem) !important;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.015em !important;
    color: $wa-ink;
    margin-top: 2.5rem;
    margin-bottom: 0.8rem;
  }

  h3 {
    font-size: 1.35rem !important;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: normal !important;
    color: $wa-ink;
    margin-top: 2rem;
    margin-bottom: 0.6rem;
  }

  h4 {
    font-size: 1.1rem !important;
    font-weight: 700;
    color: $wa-ink;
    margin-top: 1.6rem;
    margin-bottom: 0.4rem;
  }
}
</style>
