// The site is prerendered, so its markup is on screen — and clickable —
// before Vue has hydrated it. This marks the moment the page behind the
// markup is actually live, which the e2e suite waits for and CSS can use to
// tell the two states apart.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("app:suspense:resolve", () => {
    document.documentElement.dataset.hydrated = "true";
  });
});
