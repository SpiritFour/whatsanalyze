import { defineNuxtPlugin } from '#app';
import VueGtag from 'vue-gtag';

export default defineNuxtPlugin((nuxtApp) => {
  const gtagConfig = {
    id: "G-XYC2EWGZZ3",
    enabled: process.env.NUXT_ENV_LOCAL === undefined,
  };

  nuxtApp.vueApp.use(VueGtag, gtagConfig);
});
