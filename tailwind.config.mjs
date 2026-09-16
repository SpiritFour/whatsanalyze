/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    preflight: false,
  },
  content: [
    "./components/wrapped/**/*.{js,vue,ts}",
    // The results page and the charts, which opt in with .wa-scope. Listed
    // file by file so Tailwind never generates a utility whose name collides
    // with a Vuetify class in a component that is not using Tailwind.
    "./components/charts/**/*.{js,vue,ts}",
    "./components/ui/**/*.{js,vue,ts}",
    "./components/ChatVisualization/*.vue",
    "./components/Cta.vue",
    "./components/FeedbackBtn.vue",
    "./components/SubscribeBtn.vue",
    "./components/Share.vue",
    "./components/DownloadPopup.vue",
    "./components/GroupOthers.vue",
    "./layouts/wrapped.vue",
    "./pages/wrapped/**/*.{js,vue,ts}",
    "./assets/wrapped/**/*.{css,scss}",
  ],
  theme: {
    extend: {
      // The shared design tokens (assets/_theme-variables.scss) reach Tailwind
      // through the custom properties, so /wrapped draws from the same
      // surfaces, accent and radii as the rest of the site.
      colors: {
        surface: {
          dark: "var(--wa-surface-dark)",
          light: "var(--wa-surface-light)",
          white: "var(--wa-surface-white)",
        },
        ink: {
          DEFAULT: "var(--wa-ink)",
          invert: "var(--wa-ink-invert)",
        },
        accent: {
          DEFAULT: "var(--wa-accent)",
          light: "var(--wa-accent-light)",
          dark: "var(--wa-accent-dark)",
        },
        // Vuetify ships its own .bg-accent / .text-accent / .bg-surface-*,
        // and it wins the cascade wherever both stylesheets are loaded — so
        // anything outside /wrapped uses these prefixed names instead.
        "wa-accent": {
          DEFAULT: "var(--wa-accent)",
          light: "var(--wa-accent-light)",
          dark: "var(--wa-accent-dark)",
        },
        "wa-ink": {
          DEFAULT: "var(--wa-ink)",
          muted: "var(--wa-ink-muted)",
          faint: "var(--wa-ink-faint)",
        },
        "wa-surface": {
          white: "var(--wa-surface-white)",
          light: "var(--wa-surface-light)",
          dark: "var(--wa-surface-dark)",
        },
      },
      borderRadius: {
        token: "var(--wa-radius-md)",
        "token-lg": "var(--wa-radius-lg)",
        "token-xl": "var(--wa-radius-xl)",
      },
      boxShadow: {
        card: "var(--wa-shadow-md)",
        raised: "var(--wa-shadow-lg)",
        accent: "var(--wa-shadow-accent)",
      },
      maxWidth: {
        shell: "var(--wa-shell-width)",
      },
    },
  },
  plugins: [],
};
