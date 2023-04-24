import { showReportDialog } from "@sentry/vue";

export default function () {
  return {
    beforeSend(event) {
      if (event.exception) {
        showReportDialog({ eventId: event.event_id });
      }
      return event;
    },
  };
}
