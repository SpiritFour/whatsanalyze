<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useSwitchLocalePath } from "#i18n";

// 1) Strongly-typed locale codes
const LOCALE_CODES = ["en", "de", "es", "pt", "fr", "it"] as const;
type LocaleCode = (typeof LOCALE_CODES)[number];

// 2) Locales array typed with LocaleCode
const locales: Array<{
  code: LocaleCode;
  name: string;
  flag: string;
  iso: string;
}> = [
  { code: "en", name: "English", flag: "🇬🇧", iso: "en-GB" },
  { code: "de", name: "Deutsch", flag: "🇩🇪", iso: "de-DE" },
  { code: "es", name: "Español", flag: "🇪🇸", iso: "es-ES" },
  { code: "pt", name: "Português", flag: "🇵🇹", iso: "pt-PT" }, // 🇵🇹 for pt-PT
  { code: "fr", name: "Français", flag: "🇫🇷", iso: "fr-FR" },
  { code: "it", name: "Italiano", flag: "🇮🇹", iso: "it-IT" },
];

// 3) i18n + router
const { locale, setLocale } = useI18n();
const router = useRouter();
const route = useRoute();
const switchLocalePath = useSwitchLocalePath();
const { trackLanguageChanged } = useAnalytics();

// 4) Selected is a ref<LocaleCode>
const selected = ref<LocaleCode>(locale.value as LocaleCode);
const isDesktop = ref(false);
let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null;

onMounted(() => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return;
  }

  mediaQuery = window.matchMedia("(min-width: 1024px)");
  isDesktop.value = mediaQuery.matches;

  mediaListener = (event: MediaQueryListEvent) => {
    isDesktop.value = event.matches;
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", mediaListener);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(mediaListener);
  }
});

onBeforeUnmount(() => {
  if (!mediaQuery || !mediaListener) {
    return;
  }

  if (typeof mediaQuery.removeEventListener === "function") {
    mediaQuery.removeEventListener("change", mediaListener);
  } else if (typeof mediaQuery.removeListener === "function") {
    mediaQuery.removeListener(mediaListener);
  }

  mediaQuery = null;
  mediaListener = null;
});

// 5) Either handle change…
const navigateToLocale = async (code: LocaleCode) => {
  if (!code) return;
  const localePath = switchLocalePath(code);
  if (!localePath) return;

  const fromLang = locale.value;
  const resolved = router.resolve(localePath);

  await setLocale(code);
  await router.push({
    path: resolved.path,
    query: { ...route.query },
    hash: route.hash || resolved.hash,
  });

  trackLanguageChanged(fromLang, code);
};

const onChange = async (e: Event) => {
  const newLocale = (e.target as HTMLSelectElement).value as LocaleCode;
  selected.value = newLocale;
  await navigateToLocale(newLocale);
};

watch(
  () => locale.value,
  (newLocale) => {
    if (LOCALE_CODES.includes(newLocale as LocaleCode)) {
      selected.value = newLocale as LocaleCode;
    }
  },
);
</script>

<template>
  <div class="relative inline-block">
    <label class="sr-only" for="lang-switch">{{
      $t("nav.selectLanguage")
    }}</label>
    <select
      id="lang-switch"
      v-model="selected"
      :aria-label="$t('nav.selectLanguage')"
      class="appearance-none pr-10 pl-3 py-2 rounded-xl bg-zinc-900/80 text-zinc-200 ring-1 ring-zinc-800/80 hover:ring-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner backdrop-blur transition-colors text-sm w-fit"
      @change="onChange"
    >
      <option v-for="loc in locales" :key="loc.code" :value="loc.code">
        {{ isDesktop ? `${loc.flag} ${loc.name}` : loc.flag }}
      </option>
    </select>
    <div
      class="pointer-events-none absolute inset-y-0 right-2 flex items-center"
    >
      <svg
        class="h-4 w-4 text-zinc-400"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clip-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          fill-rule="evenodd"
        />
      </svg>
    </div>
  </div>
</template>
