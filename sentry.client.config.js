import * as Sentry from "@sentry/nuxt";

const config = useRuntimeConfig();

Sentry.init({
  dsn:
    "https://48bdeb273a134a8095aef20174fdadcb@o824314.ingest.sentry.io/5810773",
  enabled: !config.public.local,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1,
  beforeSend(event) {
    if (!config.public.local && event.exception) {
      Sentry.showReportDialog({ eventId: event.event_id });
    }
    return event;
  },
});
