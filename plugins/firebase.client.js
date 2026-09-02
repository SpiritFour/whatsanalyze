import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const app = initializeApp(config.public.firebase);
  const firestore = getFirestore(app);
  const functions = getFunctions(app);

  if (config.public.firebase.functionsEmulatorPort) {
    connectFunctionsEmulator(
      functions,
      "127.0.0.1",
      config.public.firebase.functionsEmulatorPort
    );
  }

  return {
    provide: {
      firebase: {
        callFunction(name, data) {
          return httpsCallable(functions, name)(data);
        },
        sendFeedback(data) {
          return addDoc(collection(firestore, "mail"), data);
        },
        serverTimestamp,
      },
    },
  };
});
