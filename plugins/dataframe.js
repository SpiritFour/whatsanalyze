import { defineNuxtPlugin } from '#app';
import DataFrame from 'dataframe-js';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(DataFrame);
});