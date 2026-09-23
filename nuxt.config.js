import fs from "node:fs";
import { resolve } from "node:path";
import {
  localeCodes,
  localizedPages,
  retiredRedirects,
  siteBaseUrl,
} from "./config/routes.js";

const local = process.env.NUXT_ENV_LOCAL !== undefined;
const runWithFunctions = process.env.NUXT_ENV_WITH_FUNCTIONS !== undefined;
const baseUrl = siteBaseUrl;
const localizedRoutes = localeCodes
  .filter((locale) => locale !== "en")
  .flatMap((locale) => localizedPages.map((page) => `/${locale}/${page}`));

export default defineNuxtConfig({
  compatibilityDate: "2026-03-01",
  srcDir: ".",
  // Prerendered, so every page ships real HTML and paints before its JS has
  // run. Without this the hero was invisible until the whole bundle had
  // hydrated: 16 s to the largest paint on a phone.
  ssr: true,

  dir: {
    public: "static",
  },
  ignore:[".delta"],

  hooks: {
    // Nuxt puts a <link rel="prefetch"> in the document head for every
    // dynamic chunk and every image those chunks reference — here 30 images
    // and 8 scripts, ~1.5 MB, all requested before the page had painted. On
    // a phone that is the entire downlink, and the first paint sat waiting
    // for the pipe to clear. Those routes load when they are navigated to.
    "build:manifest"(manifest) {
      for (const entry of Object.values(manifest)) {
        entry.prefetch = false;
      }
    },
  },

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
      // /sitemap.xml is a server route; prerendering it writes a real sitemap
      // into dist instead of letting the SPA shell answer for it.
      // The retired paths have no page of their own, so they are only written
      // into dist if the prerenderer is told to visit them.
      routes: [
        ...localizedRoutes,
        ...Object.keys(retiredRedirects),
        "/sitemap.xml",
      ],
    },
  },

  // Retired URLs, prerendered as redirect stubs so they survive on GitHub
  // Pages. See retiredPages in config/routes.js for why firebase.json cannot
  // carry these.
  routeRules: Object.fromEntries(
    Object.entries(retiredRedirects).map(([from, to]) => [
      from,
      { redirect: { to, statusCode: 301 } },
    ])
  ),

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
      // One project per environment. Firestore and the functions have to come
      // from the same project: the functions charge in the Stripe mode of the
      // project they run in, so a local build paying in test mode must not
      // write its shared chats into the database real customers read from.
      // `whatsanalyze-wrapped` is the dev project -- its id is frozen from when
      // Wrapped was a separate product, only the display name says dev.
      firebase: local
        ? {
            apiKey: "AIzaSyCCX536nN4oTAXj49M_M1ZShD3ekLdjkBo",
            authDomain: "whatsanalyze-wrapped.firebaseapp.com",
            projectId: "whatsanalyze-wrapped",
            storageBucket: "whatsanalyze-wrapped.firebasestorage.app",
            messagingSenderId: "761196645139",
            appId: "1:761196645139:web:88191b29876feb404ae8e6",
            functionsEmulatorPort: runWithFunctions ? 5001 : null,
          }
        : {
            apiKey: "AIzaSyBWNP0Ckw94E7tyoZZozAOZ6JSQRH2lzFU",
            authDomain: "whatsanalyze-80665.firebaseapp.com",
            projectId: "whatsanalyze-80665",
            storageBucket: "whatsanalyze-80665.appspot.com",
            messagingSenderId: "116352567232",
            appId: "1:116352567232:web:b44bef99e5a4fc6c962a25",
            functionsEmulatorPort: runWithFunctions ? 5001 : null,
          },
      // Full subscription price. The reduced first month is a coupon applied
      // server-side (INTRO_COUPON_ID), not a separate price: Checkout ignores
      // the Trial Offer configured on the product.
      stripePriceId: local
        ? "price_1UGehh74KJ57kF2woEzDq1UR"
        : "price_1UGedRL4rDqbYflomrrqwaYy",
      stripeOneTimePriceId: local
        ? "price_1UEjOz74KJ57kF2wXRhOyf05"
        : "price_1UEjQ4L4rDqbYflo33cJS7RR",
    },
  },

  css: ["~/assets/variables.scss"],

  modules: [
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@nuxtjs/tailwindcss",
    "vuetify-nuxt-module",
    "@nuxt/content",
    "@nuxtjs/i18n",
    "@vite-pwa/nuxt",
    "@nuxt/scripts",
    "@sentry/nuxt/module",
  ],

  tailwindcss: {
    cssPath: "~/assets/tailwind.css",
    configPath: "tailwind.config.mjs",
    exposeConfig: false,
    viewer: false,
  },

  pinia: {
    storesDirs: ["./stores/**"],
  },

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
