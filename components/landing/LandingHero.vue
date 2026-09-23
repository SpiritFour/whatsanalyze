<template>
  <header
    :class="['landing-hero', align === 'left' ? 'landing-hero--left' : '']"
  >
    <!-- No reveal animation here, unlike the sections below: the hero is the
         LCP element, and starting it at opacity 0 meant the largest paint
         waited for hydration instead of for the prerendered HTML. -->
    <div ref="inner" class="landing-hero__inner">
      <nav
        v-if="breadcrumbs && breadcrumbs.length"
        class="landing-hero__breadcrumbs"
        aria-label="Breadcrumbs"
      >
        <template v-for="(crumb, i) in breadcrumbs">
          <NuxtLink
            v-if="crumb.to"
            :key="`link-${i}`"
            :to="crumb.to"
            class="landing-hero__breadcrumb-link"
          >
            {{ crumb.label }}
          </NuxtLink>
          <span
            v-else
            :key="`crumb-${i}`"
            class="landing-hero__breadcrumb-current"
            >{{ crumb.label }}</span
          >
          <span
            v-if="i < breadcrumbs.length - 1"
            :key="`sep-${i}`"
            class="landing-hero__breadcrumb-sep"
            >/</span
          >
        </template>
      </nav>
      <!-- Copy and visual are siblings so the left-aligned variant can put them
           side by side instead of stacking the visual under a half-empty
           hero. -->
      <div class="landing-hero__copy">
        <p v-if="eyebrow" class="landing-hero__eyebrow">{{ eyebrow }}</p>
        <h1 class="landing-hero__title" v-html="renderedTitle"></h1>
        <p v-if="subtitle" class="landing-hero__subtitle">{{ subtitle }}</p>
        <div v-if="ctaText" class="landing-hero__actions">
          <LandingButton :to="ctaTo">{{ ctaText }}</LandingButton>
        </div>
        <p v-if="note" class="landing-hero__note">{{ note }}</p>
      </div>
      <div v-if="$slots.default" class="landing-hero__visual">
        <slot />
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: "LandingHero",
  props: {
    align: { type: String, default: "center" },
    breadcrumbs: { type: Array, default: () => [] },
    eyebrow: { type: String, default: "" },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    ctaTo: { type: [String, Object], default: "/" },
    note: { type: String, default: "" },
  },
  computed: {
    renderedTitle() {
      if (!this.title) return "";
      if (this.title.includes("landing-hero__title-line")) {
        return this.title;
      }
      if (/<br\s*\/?>/i.test(this.title)) {
        return this.title
          .split(/<br\s*\/?>/i)
          .map(
            (part) =>
              `<span class="landing-hero__title-line">${part.trim()}</span>`,
          )
          .join("");
      }
      return this.title;
    },
  },
};
</script>

<style lang="scss" scoped>
.landing-hero {
  background: #0d1418;
  color: #f5f5f7;
  text-align: center;
  padding: 4rem 1.5rem clamp(2rem, 6vw, 4rem);
  overflow: hidden;
}

.landing-hero__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.landing-hero__breadcrumbs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: rgba(245, 245, 247, 0.6);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.landing-hero__breadcrumb-link {
  color: rgba(245, 245, 247, 0.6);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #ffffff;
  }
}

.landing-hero__breadcrumb-current {
  color: #f5f5f7;
  font-weight: 500;
}

.landing-hero__breadcrumb-sep {
  color: rgba(245, 245, 247, 0.35);
}

.landing-hero__eyebrow {
  color: $c-blue-accent-light;
  font-size: clamp(0.95rem, 1.5vw, 1.15rem);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1.2rem;
}

.landing-hero__title {
  font-size: clamp(2.2rem, 5.5vw, 4.2rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 auto;
  max-width: 60rem;

  :deep(.landing-hero__title-line) {
    display: block;
  }
}

.landing-hero__subtitle {
  font-size: clamp(1.1rem, 2.2vw, 1.45rem);
  line-height: 1.5;
  color: rgba(245, 245, 247, 0.72);
  max-width: 44rem;
  margin: 1.6rem auto 0;
}

.landing-hero__actions {
  margin-top: 2.4rem;
}

.landing-hero__note {
  margin-top: 1.2rem;
  font-size: 0.95rem;
  color: rgba(245, 245, 247, 0.55);
}

.landing-hero__visual {
  margin-top: clamp(1rem, 7vw, 3rem);
}
.landing-hero--left {
  text-align: left;

  .landing-hero__inner {
    text-align: left;
  }

  .landing-hero__breadcrumbs {
    justify-content: flex-start;
  }

  .landing-hero__title {
    margin: 0;
    max-width: none;
    font-size: clamp(2rem, 4.4vw, 3.6rem);

    :deep(.landing-hero__title-line) {
      display: block;
      white-space: nowrap;
    }
  }

  .landing-hero__subtitle {
    margin: 1.6rem 0 0;
    max-width: 48rem;
  }

  .landing-hero__actions {
    display: flex;
    justify-content: flex-start;
  }

  // Once there is room for it, the visual sits beside the copy rather than
  // under it: the left-aligned hero used to leave the whole right half of the
  // screen empty and push its preview mock below the fold.
  @media (min-width: 1000px) {
    .landing-hero__inner {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
      column-gap: clamp(2rem, 5vw, 4rem);
      align-items: center;
    }

    .landing-hero__breadcrumbs {
      grid-column: 1 / -1;
    }

    .landing-hero__copy {
      grid-column: 1;
      min-width: 0;
    }

    // The designed line breaks are kept as separate lines, but they may not
    // refuse to wrap: half the width means a long one would otherwise run
    // straight across the visual next to it.
    .landing-hero__title {
      font-size: clamp(2rem, 3.4vw, 3.1rem);

      :deep(.landing-hero__title-line) {
        white-space: normal;
      }
    }

    .landing-hero__visual {
      grid-column: 2;
      margin-top: 0;
    }
  }
}

@media (max-width: 600px) {
  .landing-hero--left .landing-hero__title {
    font-size: clamp(1.35rem, 5.2vw, 2rem);
  }
}

@media (max-width: 380px) {
  .landing-hero--left .landing-hero__title {
    font-size: clamp(1.15rem, 5vw, 1.5rem);
  }
}
</style>
