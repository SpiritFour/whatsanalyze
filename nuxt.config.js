import fs from "node:fs";
import { resolve } from "node:path";

const local = process.env.NUXT_ENV_LOCAL !== undefined;
const runWithFunctions = process.env.NUXT_ENV_WITH_FUNCTIONS !== undefined;
const baseUrl = (process.env.BASE_URL || "https://www.whatsanalyze.com").replace(
  "http:",
  "https:"
);
const localizedPages = [
  "",
  "about",
  "how-to-export-your-whatsapp-chat",
  "impressum",
  "pwa-results",
  "subscribe",
  "switch-from-whatsapp-to-signal",
  "tools",
  "tools/court-evidence",
  "tools/inactivity",
  "tools/proof-of-relationship",
  "whatsapp-to-pdf",
  "whatsapp-wrapped-year-review",
];
const localizedRoutes = ["de", "es", "fr", "pt", "it"].flatMap((locale) =>
  localizedPages.map((page) => `/${locale}/${page}`)
);

export default defineNuxtConfig({
  compatibilityDate: "2026-03-01",
  srcDir: ".",
  ssr: false,

  dir: {
    public: "static",
  },
  ignore:[".delta"],

  nitro: {
    preset: "static",
    output: {
      publicDir: resolve("./dist"),
    },
    watch: [
      "components/**",
      "composables/**",
      "content/**",
      "layouts/**",
      "middleware/**",
      "modules/**",
      "pages/**",
      "plugins/**",
      "utils/**",
    ],
    prerender: {
      routes: localizedRoutes,
    },
  },

  app: {
    head: {
      title: "WhatsAnalyze - The WhatsApp Chat Analyzer",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "msvalidate.01",
          content: "E04DE33CC93C0FF892248C9E70A9A918",
        },
        {
          property: "og:image",
          content: `${baseUrl}/sharePreview.png`,
        },
      ],
      link: [
        { rel: "icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/favicon.ico" },
      ],
    },
  },

  runtimeConfig: {
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN,
    public: {
      local,
      baseUrl,
      paypalClientId: local
        ? "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec"
        : "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8",
      firebase: {
        apiKey: "AIzaSyBWNP0Ckw94E7tyoZZozAOZ6JSQRH2lzFU",
        authDomain: "whatsanalyze-80665.firebaseapp.com",
        projectId: "whatsanalyze-80665",
        storageBucket: "whatsanalyze-80665.appspot.com",
        messagingSenderId: "116352567232",
        appId: "1:116352567232:web:b44bef99e5a4fc6c962a25",
        measurementId: "G-H1WL9MXJ17",
        functionsEmulatorPort: runWithFunctions ? 5001 : null,
      },
    },
  },

  css: ["~/assets/variables.scss"],

  modules: [
    "vuetify-nuxt-module",
    "@nuxt/content",
    "@nuxtjs/i18n",
    "@vite-pwa/nuxt",
    "@nuxt/scripts",
    "@sentry/nuxt/module",
  ],

  vuetify: {
    moduleOptions: {
      prefixComposables: true,
      styles: true,
    },
    vuetifyOptions: {
      icons: {
        defaultSet: "mdi",
        sets: "mdi",
      },
      theme: {
        defaultTheme: "light",
        themes: {
          light: {
            dark: false,
            colors: {
              primary: "#1976d2",
              secondary: "#ff8f00",
              accent: "#424242",
              info: "#26a69a",
              warning: "#ffc107",
              error: "#dd2c00",
              success: "#00e676",
            },
          },
        },
      },
    },
  },

  i18n: {
    baseUrl,
    defaultLocale: "en",
    strategy: "prefix_except_default",
    locales: [
      { code: "en", language: "en-US", name: "English" },
      { code: "de", language: "de-DE", name: "Deutsch" },
      { code: "es", language: "es-ES", name: "Español" },
      { code: "fr", language: "fr-FR", name: "Français" },
      { code: "pt", language: "pt-PT", name: "Português" },
      { code: "it", language: "it-IT", name: "Italiano" },
    ],
    detectBrowserLanguage: {
      alwaysRedirect: false,
      fallbackLocale: "en",
      redirectOn: "root",
      useCookie: true,
      cookieCrossOrigin: false,
      cookieKey: "i18n_redirected",
      cookieSecure: false,
    },
    vueI18n: "./i18n.config.js",
  },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "WhatsAnalyze - The WhatsApp Chat Analyzer",
      short_name: "WhatsAnalyze",
      start_url: "/",
      display: "standalone",
      background_color: "#21a68d",
      theme_color: "#000000",
      lang: "en",
      icons: [
        {
          src: "/favicon.ico",
          sizes: "any",
          type: "image/x-icon",
        },
      ],
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
      // @vite-pwa/nuxt overrides workbox's default globPatterns (["**/*.{js,wasm,css,html}"])
      // with its own narrow list when payloadExtraction/appManifest kick in, which left
      // index.html and all _nuxt assets out of the precache manifest and made the
      // NavigationRoute fallback "/" throw "non-precached-url". Restore the default set.
      globPatterns: ["**/*.{js,wasm,css,html}"],
    },
    devOptions: {
      enabled: false,
    },
  },

  scripts: {
    registry: {
      googleAnalytics: local
        ? false
        : {
            id: "G-XYC2EWGZZ3",
            trigger: "onNuxtReady",
            bundle: false,
            proxy: false,
          },
      googleTagManager: local
        ? false
        : {
            id: "GTM-W32PNH3",
            trigger: "onNuxtReady",
            bundle: false,
            proxy: false,
          },
    },
  },

  sentry: process.env.SENTRY_AUTH_TOKEN
    ? {
        sourceMapsUploadOptions: {
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: "whatsanalyze",
          project: "whatsanalyze",
          telemetry: false,
        },
      }
    : {},

  sourcemap: {
    client: "hidden",
  },

  vite: {
    server: {
      watch: {
        ignored: ["**/.delta/**", "**/dist/**"],
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/_theme-variables.scss" as *;',
        },
      },
    },
  },

  devServer: {
    host: "0.0.0.0",
    https: local
      ? {
          key: fs.readFileSync(resolve("./localhost-key.pem")).toString(),
          cert: fs.readFileSync(resolve("./localhost.pem")).toString(),
        }
      : false,
  },
});
