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
    extend: {},
  },
  plugins: [],
};
