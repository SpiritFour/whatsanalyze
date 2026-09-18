<template>
  <!-- The bar is sticky, so html2canvas draws it over the top of whatever it
       is capturing. It has no business in a downloaded chart. -->
  <header class="site-header" data-html2canvas-ignore>
    <div class="site-header__inner">
      <NuxtLink :to="localePath('/')" class="site-header__brand">
        <img
          alt="WhatsAnalyze logo"
          class="site-header__logo"
          src="~/assets/whatsanalyze-logo-white.png"
        />
        <span class="site-header__wordmark">WhatsAnalyze</span>
      </NuxtLink>

      <nav class="site-header__nav" aria-label="Products">
        <NuxtLink
          v-for="product in otherProducts"
          :key="product.to"
          :to="product.to"
          class="site-header__link site-header__link--product"
        >
          <v-icon size="16">{{ product.icon }}</v-icon>
          {{ product.label }}
        </NuxtLink>
      </nav>

      <div class="site-header__actions">
        <nav class="site-header__nav site-header__nav--support">
          <NuxtLink
            v-for="link in supportLinks"
            :key="link.to"
            :to="link.to"
            class="site-header__link"
          >
            <v-icon v-if="link.icon" size="16">{{ link.icon }}</v-icon>
            {{ link.label }}
          </NuxtLink>
        </nav>
        <LanguageSwitcher />
        <button
          type="button"
          class="site-header__burger"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? $t('common.close') : $t('common.menu')"
          @click="menuOpen = !menuOpen"
        >
          <v-icon size="22">{{ menuOpen ? "mdi-close" : "mdi-menu" }}</v-icon>
        </button>
      </div>
    </div>

    <nav v-if="menuOpen" class="site-header__mobile">
      <NuxtLink
        v-for="product in otherProducts"
        :key="product.to"
        :to="product.to"
        class="site-header__mobile-link"
      >
        <v-icon size="18">{{ product.icon }}</v-icon>
        {{ product.label }}
      </NuxtLink>
      <NuxtLink
        v-for="link in supportLinks"
        :key="link.to"
        :to="link.to"
        class="site-header__mobile-link site-header__mobile-link--support"
      >
        <v-icon v-if="link.icon" size="18">{{ link.icon }}</v-icon>
        {{ link.label }}
      </NuxtLink>
    </nav>
  </header>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import LanguageSwitcher from "~/components/LanguageSwitcher.vue";
import { useSubscriptionStore } from "~/stores/subscription";

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const { isVerified } = storeToRefs(useSubscriptionStore());

const menuOpen = ref(false);

/** Which of the three products the reader is in right now. */
const currentProduct = computed(() => {
  const path = route.path;
  if (/(^|\/)wrapped(\/|$)/.test(path)) return "wrapped";
  if (/(^|\/)tools(\/|$)/.test(path)) return "tools";
  return "analyzer";
});

const PRODUCT_ORDER = ["analyzer", "wrapped", "tools"];

/**
 * The header leads with the two products you are not using — the third is the
 * page you are already on, and a link to that is just noise. The order is
 * fixed, so the bar does not reshuffle itself as you move around the site.
 */
const otherProducts = computed(() => {
  const products = {
    analyzer: {
      to: localePath("/"),
      label: "Analyzer",
      icon: "mdi-chart-box-outline",
    },
    wrapped: {
      to: localePath("/wrapped"),
      label: "Wrapped",
      icon: "mdi-star-four-points-outline",
    },
    tools: {
      to: localePath("/tools"),
      label: t("toolsHub.headerTools"),
      icon: "mdi-toolbox-outline",
    },
  };

  return PRODUCT_ORDER.filter((key) => key !== currentProduct.value).map(
    (key) => products[key]
  );
});

/**
 * The three /wrapped kept in its own bar, now on every page. Each one points
 * at the version that belongs to the product you are in: inside /wrapped they
 * are its own sections and its own subscription check, everywhere else the
 * main site's pages.
 */
const supportLinks = computed(() => {
  const onWrapped = currentProduct.value === "wrapped";
  const wrappedHome = localePath("/wrapped");

  return [
    {
      to: onWrapped
        ? localePath("/wrapped/subscription/verify")
        : localePath("/subscribe"),
      label: t("nav.subscription"),
      icon: isVerified.value
        ? "mdi-check-circle-outline"
        : "mdi-information-outline",
    },
    {
      // The main site keeps its privacy statement inside the imprint page.
      to: onWrapped ? `${wrappedHome}#privacy` : localePath("/impressum"),
      label: t("nav.privacy"),
    },
    {
      to: onWrapped
        ? `${wrappedHome}#guide`
        : localePath("/how-to-export-your-whatsapp-chat"),
      label: t("nav.exportGuide"),
    },
  ];
});

// A tap that navigates has to close the panel it was tapped in, otherwise the
// menu stays open over the page it just opened.
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  }
);
</script>

<style lang="scss" scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #0d1418;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $wa-border-invert;
  color: $wa-ink-invert;
}

.site-header__inner {
  max-width: $wa-shell-width;
  margin: 0 auto;
  padding: 0.7rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 600px) {
    padding: 0.6rem 1rem;
    gap: 0.75rem;
  }
}

.site-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  flex-shrink: 0;
}

.site-header__logo {
  height: 30px;
  width: auto;
  display: block;

  @media (max-width: 600px) {
    height: 24px;
  }
}

.site-header__wordmark {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: $wa-ink-invert;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 1.05rem;
  }
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-right: auto;

  @media (max-width: 1024px) {
    display: none;
  }
}

/* The three secondary destinations, next to the language picker. */
.site-header__nav--support {
  margin-right: 0;
  gap: 0.15rem;
}

.site-header__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  border-radius: $wa-radius-sm;
  font-size: 0.92rem;
  font-weight: 600;
  color: $wa-ink-invert-muted;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease, background 0.2s ease;

  &:hover {
    color: $wa-ink-invert;
    background: $wa-surface-dark-raised;
  }

  &--product {
    color: $wa-ink-invert;
  }
}

.site-header__nav--support .site-header__link {
  font-size: 0.85rem;
  font-weight: 500;
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

.site-header__burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: $wa-radius-sm;
  border: 1px solid $wa-border-invert;
  color: $wa-ink-invert;
  background: transparent;
  cursor: pointer;

  @media (max-width: 1024px) {
    display: inline-flex;
  }
}

.site-header__mobile {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 1rem 1rem;
  border-top: 1px solid $wa-border-invert;

  @media (min-width: 1025px) {
    display: none;
  }
}

.site-header__mobile-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.6rem;
  border-radius: $wa-radius-sm;
  font-size: 0.95rem;
  font-weight: 600;
  color: $wa-ink-invert-muted;
  text-decoration: none;

  &:hover {
    background: $wa-surface-dark-raised;
    color: $wa-ink-invert;
  }

  /* Secondary, so the two products stay the first thing in the panel. */
  &--support {
    font-size: 0.9rem;
    font-weight: 500;
    color: $wa-ink-invert-faint;
  }
}
</style>
