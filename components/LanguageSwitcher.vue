<template>
  <div class="language-switcher">
    <label class="language-switcher__label" for="language-select">
      {{ $t("nav.selectLanguage") }}
    </label>
    <select
      id="language-select"
      :value="locale"
      :aria-label="$t('nav.selectLanguage')"
      class="language-switcher__select"
      @change="onChange"
    >
      <option v-for="l in locales" :key="l.code" :value="l.code">
        {{ isWide ? `${flags[l.code]} ${l.name}` : flags[l.code] }}
      </option>
    </select>
    <v-icon size="16" class="language-switcher__chevron">
      mdi-chevron-down
    </v-icon>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { analyticsSite } from "~/composables/useAnalytics";

const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const flags = {
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
  pt: "🇵🇹",
  fr: "🇫🇷",
  it: "🇮🇹",
};

// Only the wide header has room for the language name next to the flag.
const isWide = ref(false);
let mediaQuery = null;
const onMediaChange = (event) => {
  isWide.value = event.matches;
};

onMounted(() => {
  if (typeof window.matchMedia !== "function") return;
  mediaQuery = window.matchMedia("(min-width: 1025px)");
  isWide.value = mediaQuery.matches;
  mediaQuery.addEventListener("change", onMediaChange);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", onMediaChange);
  mediaQuery = null;
});

const onChange = (event) => {
  const target = event.target.value;
  analyticsSite.languageChanged(locale.value, target);
  return navigateTo(switchLocalePath(target));
};
</script>

<style scoped lang="scss">
.language-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.language-switcher__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.language-switcher__select {
  appearance: none;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0.5rem 1.9rem 0.5rem 0.7rem;
  border-radius: $wa-radius-sm;
  border: 1px solid $wa-border-invert;
  background: $wa-surface-dark-raised;
  color: $wa-ink-invert;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: rgba(245, 245, 247, 0.28);
  }

  &:focus-visible {
    outline: 2px solid $wa-accent;
    outline-offset: 1px;
  }

  // The dropdown itself is drawn by the OS and does not inherit the dark
  // surface — keep its own options readable.
  option {
    color: $wa-ink;
    background: $wa-surface-white;
  }
}

.language-switcher__chevron {
  position: absolute;
  right: 0.5rem;
  pointer-events: none;
  color: $wa-ink-invert-faint;
}
</style>
