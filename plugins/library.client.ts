import { useLibrary } from "~/composables/useLibrary";

// Saved chats are read at the start of every visit, whichever page it starts
// on, so "Forget chats not opened in 90 days" has run before any list shows
// them (docs/saved-chats.md). After hydration: the list is never in the first
// paint, and a page that needs it sooner asks for it itself.
export default defineNuxtPlugin((nuxtApp) => {
  const library = useLibrary();
  nuxtApp.hook("app:suspense:resolve", () => {
    void library.load();
  });
});
