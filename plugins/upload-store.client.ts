import { loadUpload } from "~/utils/uploadStore";

// A chat export kept by an earlier visit is wiped on the first page of a new
// one, whichever page that is (see utils/uploadStore.ts).
export default defineNuxtPlugin(() => {
  if (typeof indexedDB !== "undefined") void loadUpload();
});
