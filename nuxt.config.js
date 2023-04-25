import fs from "fs";
import colors from "vuetify/es5/util/colors";
import { messages } from "./utils/translations.js";

// eslint-disable-next-line no-undef
const local = process.env.NUXT_ENV_LOCAL !== undefined;
const baseUrl = // eslint-disable-next-line no-undef
(process.env.BASE_URL || "https://www.whatsanalyze.com").replace(
  "http:",
  "https:"
);

export default {
  publicRuntimeConfig: {
    local,
    baseUrl,
    paypalClientId: local
      ? "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec"
      : "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8",
    privateRuntimeConfig: {
      // eslint-disable-next-line no-undef
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    },
  },

  // Target: https://go.nuxtjs.dev/config-target
  target: "static",

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    htmlAttrs: {
      lang: "en",
    },

    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // bing indexing
      { name: "msvalidate.01", content: "E04DE33CC93C0FF892248C9E70A9A918" },
      {
        hid: "og:image",
        property: "og:image",
        content: baseUrl + "/sharePreview.png",
      },
    ],
    link: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
  },
  pwa: {
    manifest: {
      name: "WhatsAnalyze - The WhatsApp Chat Analyzer",
      short_name: "WhatsAnalyze",
      start_url: "/",
      display: "standalone",
      background_color: "#21a68d",
      theme_color: "#000000",
      lang: "en",
      useWebmanifestExtension: true,
      share_target: {
        action: "/pwa-results?share-target=1",
        method: "POST",
        enctype: "multipart/form-data",
        params: {
          title: "name",
          text: "description",
          url: "link",
          files: [
            {
              name: "file",
              accept: ["*/*"],
            },
          ],
        },
      },
    },
    workbox: {
      importScripts: ["custom-sw.js"],
      dev: local,
    },
    icon: {
      source: "/assets",
      fileName: "whatsanalyze-logo-black-PWA.png",
    },
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    "@/plugins/gtag",
    {
      src: "~/plugins/amcharts.js",
      ssr: false,
    },
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    "@nuxtjs/vuetify",
    "nuxt-compress",
    "@nuxtjs/sentry",
    "@nuxt/typescript-build",
  ],
  "nuxt-compress": {
    gzip: {
      cache: true,
    },
    brotli: {
      threshold: 10240,
    },
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    "@nuxt/content",
    "@nuxtjs/pwa",
    "@nuxtjs/gtm",
    "nuxt-i18n",
    "@nuxtjs/firebase",
  ],
  firebase: {
    config: {
      apiKey: "AIzaSyBWNP0Ckw94E7tyoZZozAOZ6JSQRH2lzFU",
      authDomain: "whatsanalyze-80665.firebaseapp.com",
      projectId: "whatsanalyze-80665",
      storageBucket: "whatsanalyze-80665.appspot.com",
      messagingSenderId: "116352567232",
      appId: "1:116352567232:web:b44bef99e5a4fc6c962a25",
      measurementId: "G-H1WL9MXJ17",
    },
    services: {
      firestore: true, // Just as example. Can be any other service.
    },
  },
  i18n: {
    seo: true,
    locales: [
      {
        code: "en",
        iso: "en-US",
      },
      {
        code: "de",
        iso: "de-DE",
      },
      {
        code: "es",
        iso: "es-ES",
      },
    ],
    defaultLocale: "en",
    detectBrowserLanguage: {
      alwaysRedirect: false,
      fallbackLocale: "en",
      onlyOnRoot: true,
      useCookie: true,
      cookieCrossOrigin: false,
      cookieKey: "i18n_redirected",
      cookieSecure: false,
    },
    vueI18n: {
      fallbackLocale: "en",
      messages,
    },
    vueI18nLoader: true,
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    treeShake: true,
    customVariables: ["~/assets/variables.scss"],
    theme: {
      dark: false,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
      },
    },
  },
  gtm: {
    id: "GTM-W32PNH3",
  },
  sentry: {
    dsn:
      "https://48bdeb273a134a8095aef20174fdadcb@o824314.ingest.sentry.io/5810773",
    disabled: local,
    sourceMapStyle: "hidden-source-map",
    publishRelease: false,
    attachCommits: true,

    // Additional Module Options go here
    // https://sentry.nuxtjs.org/sentry/options
    config: {
      // Add native Sentry config here
      // https://docs.sentry.io/platforms/javascript/guides/vue/configuration/options/
      tracesSampleRate: 1.0,
      vueOptions: {
        tracing: true,
        tracingOptions: {
          hooks: ["mount", "update"],
          timeout: 2000,
          trackComponents: true,
        },
      },
      browserOptions: {},
    },
    clientConfig: "~/plugins/sentry.client.config.js",
    webpackConfig: {
      include: ["./dist/"],
      ignore: ["node_modules"],
      org: "whatsanalyze",
      project: "whatsanalyze",
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend(config, { isDev, isClient }) {
      // Sets webpack's mode to development if `isDev` is true.
      if (isDev) {
        config.mode = "development";
      } else if (isClient) {
        config.devtool = "hidden-source-map";
      }
    },
  },
  server: {
    host: "0.0.0.0",
    https:
      // eslint-disable-next-line no-undef
      process.env.NODE_ENV !== "production" || local
        ? {
            key: fs.readFileSync("./0.0.0.0.key"),
            cert: fs.readFileSync("./0.0.0.0.crt"),
          }
        : {},
  },
};
