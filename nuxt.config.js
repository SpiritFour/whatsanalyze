import colors from "vuetify/es5/util/colors";
import fs from "fs";

export default {
  // redirect from http -> https
  serverMiddleware: [
    // Will register redirect-ssl npm package
    "redirect-ssl",
  ],

  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: "static",

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: "Whats Analyze - The WhatsApp Chat Analyzer",
    title: "Whats Analyze - The WhatsApp Chat Analyzer",
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content:
          "America's Most Popular WhatsApp Analyzer ✓ Now offering Group chats ✓ Reveal your friends character ✓ No Chat Data is sent to a Server. Get Started now!",
      },
      // bing indexing
      { name: "msvalidate.01", content: "E04DE33CC93C0FF892248C9E70A9A918" },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
  },
  pwa: {
    manifest: {
      name: "Whats Analyze - The WhatsApp Chat Analyzer",
      short_name: "whatsanalyze.com",
      description:
        "America's Most Popular WhatsApp Analyzer ✓ Now offering Group chats ✓ Reveal your friends character ✓ No Chat Data is sent to a Server. Get Started now!",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#21a68d",
      lang: "en",
      useWebmanifestExtension: true,
      share_target: {
        action: "/data2",
        method: "POST",
        enctype: "multipart/form-data",
        params: {
          title: "name",
          text: "description",
          url: "link",
          files: [
            {
              name: "records",
              accept: ["text/txt", ".txt"],
            },
            {
              name: "graphs",
              accept: "image/svg+xml",
            },
          ],
        },
      },
    },
    workbox: {
      importScripts: ["custom-sw.js"],
    },
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ["@/plugins/gtag"],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    "@nuxtjs/vuetify",
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: ["@nuxt/content", "@nuxtjs/pwa"],

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

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend(config, { isDev }) {
      // Sets webpack's mode to development if `isDev` is true.
      if (isDev) {
        config.mode = "development";
      }
    },
  },
  server: {
    host: "0.0.0.0",
    https:
      // eslint-disable-next-line no-undef
      process.env.NODE_ENV !== "production"
        ? {
            key: fs.readFileSync("0.0.0.0.key"),
            cert: fs.readFileSync("0.0.0.0.crt"),
          }
        : {},
  },
};
