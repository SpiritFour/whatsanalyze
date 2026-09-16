<template>
  <header class="site-header" :class="{ 'site-header--static': !sticky }">
    <div class="site-header__inner">
      <NuxtLink :to="localePath('/')" class="site-header__brand">
        <img
          alt="WhatsAnalyze logo"
          class="site-header__logo"
          src="~/assets/whatsanalyze-logo-white.png"
        />
        <span class="site-header__wordmark">WhatsAnalyze</span>
      </NuxtLink>

      <nav class="site-header__nav" :aria-label="$t('toolsHub.headerTools')">
        <NuxtLink :to="localePath('/tools')" class="site-header__link">
          <v-icon size="16">mdi-toolbox-outline</v-icon>
          {{ $t("toolsHub.headerTools") }}
        </NuxtLink>

        <NuxtLink :to="localePath('/wrapped')" class="site-header__link">
          <v-icon size="16">mdi-star-four-points-outline</v-icon>
          {{ $t("homeLanding.wrappedNav") }}
        </NuxtLink>

        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="site-header__link"
        >
          <v-icon v-if="link.icon" size="16">{{ link.icon }}</v-icon>
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="site-header__actions">
        <NuxtLink v-if="showCta" :to="ctaTo" class="site-header__cta">
          <v-icon size="16">{{ ctaIcon }}</v-icon>
          {{ ctaLabel }}
        </NuxtLink>
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
      <NuxtLink :to="localePath('/tools')" class="site-header__mobile-link">
        <v-icon size="18">mdi-toolbox-outline</v-icon>
        {{ $t("toolsHub.headerTools") }}
      </NuxtLink>
      <NuxtLink :to="localePath('/wrapped')" class="site-header__mobile-link">
        <v-icon size="18">mdi-star-four-points-outline</v-icon>
        {{ $t("homeLanding.wrappedNav") }}
      </NuxtLink>
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="site-header__mobile-link"
      >
        <v-icon v-if="link.icon" size="18">{{ link.icon }}</v-icon>
        {{ link.label }}
      </NuxtLink>
      <NuxtLink
        v-if="showCta"
        :to="ctaTo"
        class="site-header__cta site-header__cta--mobile"
      >
        <v-icon size="16">{{ ctaIcon }}</v-icon>
        {{ ctaLabel }}
      </NuxtLink>
    </nav>
  </header>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import LanguageSwitcher from "~/components/LanguageSwitcher.vue";

const props = defineProps({
  /** Extra nav entries: [{ label, to, icon? }]. /wrapped adds its own here. */
  links: { type: Array, default: () => [] },
  /** Main action. Defaults to the analyzer, which is the homepage. */
  cta: { type: Object, default: null },
  /**
   * Off for the html2canvas copy in the downloadable graphs: html2canvas
   * cannot render the translucent, blurred bar and paints a grey smear.
   */
  sticky: { type: Boolean, default: true },
});

const { locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const menuOpen = ref(false);

const analyzeLabel = computed(() => {
  const map = {
    de: "Chat analysieren",
    es: "Analizar chat",
    fr: "Analyser le chat",
    pt: "Analisar conversa",
    it: "Analizza chat",
  };
  return map[locale.value] || "Analyze Chat";
});

const ctaTo = computed(() => props.cta?.to || localePath("/"));
const ctaLabel = computed(() => props.cta?.label || analyzeLabel.value);
const ctaIcon = computed(() => props.cta?.icon || "mdi-message-text-outline");

// A call to action pointing at the page you are already reading is not one —
// on the homepage it read as a button that should open something, and did
// nothing at all.
const samePath = (a, b) =>
  String(a).split("#")[0].replace(/\/$/, "") === String(b).replace(/\/$/, "");
const showCta = computed(
  () => typeof ctaTo.value !== "string" || !samePath(ctaTo.value, route.path)
);

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

  &--static {
    position: static;
    background: $wa-surface-dark;
    backdrop-filter: none;
  }
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
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

.site-header__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1.1rem;
  border-radius: $wa-radius-pill;
  background: $wa-accent;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: $wa-accent-light;
    transform: translateY(-1px);
  }

  @media (max-width: 600px) {
    display: none;
  }

  &--mobile {
    display: inline-flex;
    justify-content: center;
    margin-top: 0.5rem;
  }
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
}
</style>
