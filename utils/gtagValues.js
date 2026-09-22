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
  category = CATEGORY_HOME
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

const readCookie = (predicate) => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => predicate(entry.split("=")[0]));
  return match ? match.slice(match.indexOf("=") + 1) : undefined;
};

/**
 * The GA identifiers of this browser, read straight off the cookies gtag
 * writes. Purchases are reported from the Stripe webhook, which sees the money
 * but not the visitor — these are what let it file the sale under the campaign
 * that brought the buyer in, instead of as a new direct user.
 *
 * Both are empty when GA never loaded: an ad blocker, or a visitor who
 * declined the analytics cookies. The webhook still books the revenue, and it
 * stays unattributed — which is what declining is supposed to mean.
 */
export function getAnalyticsIds() {
  // "GA1.1.1234567890.1700000000" — the client id is the last two parts.
  const ga = readCookie((name) => name === "_ga");
  const clientId = ga ? ga.split(".").slice(-2).join(".") : undefined;

  // "GS2.1.s1700000000$o3$g1$..." on the per-property cookie. There is only
  // one GA4 container on this site, so the suffix does not have to be known.
  const session = readCookie((name) => name.startsWith("_ga_"));
  const sessionId = session
    ? session.split(".")[2]?.replace(/^s/, "").split("$")[0]
    : undefined;

  // Only what was actually found: the callable SDK turns an undefined property
  // into a null on the wire, and a null id has no business reaching Stripe.
  return {
    ...(clientId ? { clientId } : {}),
    ...(sessionId ? { sessionId } : {}),
  };
}
