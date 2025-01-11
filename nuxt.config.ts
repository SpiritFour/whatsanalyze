const local = process.env.NUXT_ENV_LOCAL !== undefined;
const run_with_functions = process.env.NUXT_ENV_WITH_FUNCTIONS !== undefined;
const baseUrl = (process.env.BASE_URL || "https://www.whatsanalyze.com").replace("http:", "https:");


// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  title: "Whatsanalyze",

  /* full static rendering */
  target: "static",
  ssr: false,


  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/i18n"
  ],


  i18n: {
    seo: true,
    locales: [
      {
        code: "en",
        iso: "en-US"
      },
      {
        code: "de",
        iso: "de-DE"
      },
      {
        code: "es",
        iso: "es-ES"
      },
      {
        code: "fr",
        iso: "fr-FR"
      },
      {
        code: "pt",
        iso: "pt-PT"
      }
    ],
    defaultLocale: "en"

    /*    detectBrowserLanguage: {
          alwaysRedirect: false,
          fallbackLocale: "en",
          onlyOnRoot: true,
          useCookie: true,
          cookieCrossOrigin: false,
          cookieKey: "i18n_redirected",
          cookieSecure: false
        },
        vueI18n: {
          fallbackLocale: "en",
          messages
        },*/
    // vueI18nLoader: true
  },

  runtimeConfig: {
    local,
    baseUrl,
    paypalClientId: local
      ? "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec"
      : "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8",
    privateRuntimeConfig: {
      // eslint-disable-next-line no-undef
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN
    }
  }

});
