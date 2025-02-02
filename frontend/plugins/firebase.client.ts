import { initializeApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  // Access the options defined in nuxt.config.ts
  const firebaseOptions = config.public.firebase;
  const firebaseApp = initializeApp(firebaseOptions);
  // todo add firestore id (for dev and prod)
  const firestore = getFirestore(firebaseApp);

  nuxtApp.provide("firestore", firestore);
});

declare module "#app" {
  interface NuxtApp {
    $firestore: Firestore;
  }
}
