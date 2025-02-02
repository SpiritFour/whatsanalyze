import { defineNuxtModule } from "@nuxt/kit";
import type { FirebaseOptions } from "@firebase/app-types";

export default defineNuxtModule<Required<FirebaseOptions>>({
  meta: {
    name: "firebase",
    configKey: "firebase",
  },
  setup(options, nuxt) {
    // Optionally, you can add a plugin dynamically
    nuxt.hook("modules:done", () => {
      nuxt.options.plugins.push("~/plugins/firebase.client");
    });

    // ignore
    nuxt.options.runtimeConfig.public.firebase = options;
  },
});
