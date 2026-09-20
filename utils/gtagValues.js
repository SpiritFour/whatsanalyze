export const CATEGORY_HOME = "home";
export const CATEGORY_WRAPPED = "wrapped";

export const GTAG_FILE = "file";
export const GTAG_RESULTS = "results";
export const GTAG_PDF = "pdf";
export const GTAG_PAYMENT = "payment";
export const GTAG_INSTALL = "install";
export const GTAG_LEAD = "lead";
export const GTAG_INTERACTION = "interaction";
export const GTAG_NUM_PERSONS = "num_persons";

import { trackEvent } from "../composables/useAnalytics";
export function gtagEvent(
  action,
  label,
  value = "1",
  category = CATEGORY_HOME,
) {
  if (typeof window === "undefined") return;

  const rawEventName = label ? `${label}_${action}` : String(action);
  const numericVal = Number(value);

  trackEvent(rawEventName, {
    event_category: category,
    event_label: label,
    value: Number.isFinite(numericVal) ? numericVal : String(value),
  });
}
