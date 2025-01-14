<template>
  <select v-model="selectedLocale" class="text-md-h3 text-h4">
    <option
      v-for="locale in availableLocales"
      :key="locale.code"
      :value="locale.code"
    >
      {{ locale.flag }}
    </option>
  </select>
</template>

<script>
export default {
  data() {
    return {
      selectedLocale: this.$i18n.locale,
      availableLocales: [
        {
          code: "en",
          name: "English",
          flag: "🇬🇧",
          iso: "en-GB",
        },
        {
          code: "de",
          name: "Deutsch",
          flag: "🇩🇪",
          iso: "de-DE",
        },
        {
          code: "es",
          name: "Español",
          flag: "🇪🇸",
          iso: "es-ES",
        },
        {
          code: "pt",
          name: "Português",
          flag: "🇧🇷",
          iso: "pt-PT",
        },
        {
          code: "fr",
          name: "Français",
          flag: "🇫🇷",
          iso: "fr-FR",
        },
        {
          code: "it",
          name: "Italiano",
          flag: "🇮🇹",
          iso: "it-IT",
        },
      ],
    };
  },
  watch: {
    selectedLocale(newLocale) {
      this.$router.push(this.switchLocalePath(newLocale));
    },
  },
};
</script>
