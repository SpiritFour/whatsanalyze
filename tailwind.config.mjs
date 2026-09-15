/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    preflight: false,
  },
  content: [
    "./components/wrapped/**/*.{js,vue,ts}",
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
