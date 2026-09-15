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
        <div
          class="site-header__tools"
          @mouseenter="toolsOpen = true"
          @mouseleave="toolsOpen = false"
        >
          <NuxtLink
            :to="localePath('/tools')"
            class="site-header__link site-header__link--trigger"
            :aria-expanded="toolsOpen"
            @click="toolsOpen = false"
          >
            <v-icon size="16">mdi-toolbox-outline</v-icon>
            {{ $t("toolsHub.headerTools") }}
            <v-icon size="14" class="site-header__chevron">
              mdi-chevron-down
            </v-icon>
          </NuxtLink>

          <div v-show="toolsOpen" class="site-header__dropdown">
            <p class="site-header__group">
              <v-icon size="13" color="#21a68d">mdi-chart-box-outline</v-icon>
              {{ $t("toolsHub.analyticsGroupTitle") }}
            </p>
            <NuxtLink
              v-for="tool in analyticsTools"
              :key="tool.to"
              :to="tool.to"
              class="site-header__tool"
              @click="toolsOpen = false"
            >
              <span
                class="site-header__tool-icon"
                :style="{ background: tool.bg }"
              >
                <v-icon size="16" :color="tool.color">{{ tool.icon }}</v-icon>
              </span>
              <span class="site-header__tool-text">
                <span class="site-header__tool-title">{{ tool.title }}</span>
                <span class="site-header__tool-desc">{{ tool.text }}</span>
              </span>
            </NuxtLink>

            <p class="site-header__group site-header__group--court">
              <v-icon size="13" color="#818cf8"
                >mdi-shield-check-outline</v-icon
              >
              {{ $t("toolsHub.courtGroupTitle") }}
            </p>
            <NuxtLink
              v-for="tool in courtTools"
              :key="tool.to"
              :to="tool.to"
              class="site-header__tool"
              @click="toolsOpen = false"
            >
              <span
                class="site-header__tool-icon"
                :style="{ background: tool.bg }"
              >
                <v-icon size="16" :color="tool.color">{{ tool.icon }}</v-icon>
              </span>
              <span class="site-header__tool-text">
                <span class="site-header__tool-title">
                  {{ tool.title }}
                  <span class="site-header__badge">PDF</span>
                </span>
                <span class="site-header__tool-desc">{{ tool.text }}</span>
              </span>
            </NuxtLink>
          </div>
        </div>

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
        <NuxtLink :to="ctaTo" class="site-header__cta">
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
      <NuxtLink
        v-for="tool in allTools"
        :key="tool.to"
        :to="tool.to"
        class="site-header__mobile-link site-header__mobile-link--nested"
      >
        <v-icon size="16" :color="tool.color">{{ tool.icon }}</v-icon>
        {{ tool.title }}
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
      <NuxtLink :to="ctaTo" class="site-header__cta site-header__cta--mobile">
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
const { analyticsTools, courtTools, allTools } = useToolsNav();

const toolsOpen = ref(false);
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

// A tap that navigates has to close the panel it was tapped in, otherwise the
// menu stays open over the page it just opened.
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
    toolsOpen.value = false;
  }
);
</script>

<style lang="scss" scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(13, 20, 24, 0.92);
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

.site-header__tools {
  position: relative;
}

.site-header__chevron {
  transition: transform 0.2s ease;
}

.site-header__tools:hover .site-header__chevron {
  transform: rotate(180deg);
}

.site-header__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.4rem;
  width: 340px;
  max-width: 90vw;
  padding: 0.5rem;
  background: #131d22;
  border: 1px solid $wa-border-invert;
  border-radius: $wa-radius-lg;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.5);
}

.site-header__group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.4rem 0 0.2rem;
  padding: 0 0.6rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $wa-ink-invert-faint;

  &--court {
    margin-top: 0.7rem;
    padding-top: 0.7rem;
    border-top: 1px solid $wa-border-invert;
    color: #a5b4fc;
  }
}

.site-header__tool {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.6rem;
  border-radius: $wa-radius-sm;
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: $wa-surface-dark-raised;
  }
}

.site-header__tool-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.site-header__tool-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.site-header__tool-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.25;
  color: $wa-ink-invert;
}

.site-header__tool-desc {
  font-size: 0.72rem;
  line-height: 1.3;
  color: $wa-ink-invert-faint;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-header__badge {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  color: #c7d2fe;
  background: rgba(129, 140, 248, 0.18);
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

  &--nested {
    padding-left: 1.6rem;
    font-size: 0.88rem;
    font-weight: 500;
  }
}
</style>
