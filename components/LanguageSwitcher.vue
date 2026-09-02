<template>
  <select
    :value="locale"
    class="text-md-h3 text-h4"
    aria-label="Select language"
    @change="setLocale"
  >
    <option
      v-for="locale in availableLocales"
      :key="locale.code"
      :value="locale.code"
    >
      {{ flags[locale.code] }} {{ locale.name }}
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
