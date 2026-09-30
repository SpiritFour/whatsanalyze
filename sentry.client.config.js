import * as Sentry from "@sentry/nuxt";

const config = useRuntimeConfig();

// Wrapped share links carry their decryption key in the URL fragment, and
// Sentry copies the page URL into the request, breadcrumbs, spans and trace
// data. Rather than chase every field, redact it across the whole event.
const scrubEvent = (event) =>
  JSON.parse(
    JSON.stringify(event).replace(/\b(key|iv)=[^&#\s"]*/g, "$1=[redacted]"),
  );

Sentry.init({
  dsn: "https://48bdeb273a134a8095aef20174fdadcb@o824314.ingest.sentry.io/5810773",
  enabled: !config.public.local,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1,
  beforeSendTransaction: scrubEvent,
  beforeSend(rawEvent) {
    const event = scrubEvent(rawEvent);
    if (!config.public.local && event.exception) {
      Sentry.showReportDialog({ eventId: event.event_id });
    }
    return event;
  },
});
