import { showReportDialog } from "@sentry/vue";

export default defineNuxtPlugin((nuxtApp) => {
  // Example: adding a custom method to Vue instance for manual error reporting
  nuxtApp.vueApp.config.globalProperties.$reportError = (error) => {
    Sentry.captureException(error);
  };

  // Additional client-specific Sentry configurations can be added here
  // For instance, modifying the beforeSend logic or adding custom integrations

  // Example beforeSend logic
  Sentry.configureScope((scope) => {
    scope.addEventProcessor((event) => {
      // Add any client-specific beforeSend logic here
      return event;
    });
  });
});
