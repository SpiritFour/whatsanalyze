import { getAnalytics, isSupported } from "firebase/analytics";
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

  let wrappedFirestore = firestore;
  let wrappedFunctions = functions;
  let analytics;

  if (config.public.wrappedFirebase) {
    try {
      const wrappedApp = initializeApp(
        config.public.wrappedFirebase,
        "wrapped"
      );
      wrappedFirestore = getFirestore(wrappedApp);

      if (
        config.public.wrappedFunctionsProjectId &&
        config.public.wrappedFunctionsProjectId !==
          config.public.wrappedFirebase.projectId
      ) {
        const functionsApp = initializeApp(
          {
            ...config.public.wrappedFirebase,
            projectId: config.public.wrappedFunctionsProjectId,
          },
          "wrapped-functions"
        );
        wrappedFunctions = getFunctions(functionsApp);
      } else {
        wrappedFunctions = getFunctions(wrappedApp);
      }
    } catch (e) {
      console.warn("Wrapped Firebase initialization:", e);
    }
  }

  if (process.client) {
    isSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          console.warn("Analytics initialization:", e);
        }
      }
    });
  }

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
      firestore,
      functions,
      wrappedFirestore,
      wrappedFunctions,
      get analytics() {
        return analytics;
      },
    },
  };
});
