<template>
  <select
    :value="locale"
    class="language-select"
    aria-label="Select language"
    @change="setLocale"
  >
    <option v-for="l in availableLocales" :key="l.code" :value="l.code">
      {{ flags[l.code] }}
    </option>
  </select>
</template>

<script setup>
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const flags = {
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
  pt: "🇧🇷",
  fr: "🇫🇷",
  it: "🇮🇹",
};

const availableLocales = computed(() => locales.value);

const setLocale = (event) => {
  return navigateTo(switchLocalePath(event.target.value));
};
</script>
<style scoped lang="scss">
.language-select {
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  background: transparent;
  border: none;
  outline: none;
  padding: 2px 4px;
  vertical-align: middle;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 600px) {
    font-size: 1.25rem;
    padding: 1px 2px;
  }
}
</style>
