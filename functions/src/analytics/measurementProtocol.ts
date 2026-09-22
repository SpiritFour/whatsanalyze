import { defineSecret, defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

export const gaApiSecret = defineSecret("GA_API_SECRET");
// Empty means "do not report": that is what the dev project wants, rather than
// writing test purchases into the live property.
export const gaMeasurementId = defineString("GA_MEASUREMENT_ID", {
  default: "",
});

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";

/** The two things that can be bought, as GA4 items. */
export const ITEM_FULL_PDF = { id: "full_chat_pdf", name: "Full Chat PDF" };
export const ITEM_PRO_SUBSCRIPTION = {
  id: "pro_subscription",
  name: "WhatsAnalyze Pro Subscription",
};

export interface PurchaseEvent {
  /** Stripe id of what was paid — the invoice or the checkout session. */
  transactionId: string;
  /** Stripe reports amounts in minor units (cents). */
  amountMinorUnits: number | null;
  currency: string | null;
  item: { id: string; name: string };
  /**
   * The browser's GA identifiers, carried through Stripe metadata from the
   * moment checkout started. Without them GA4 has no one to attribute the sale
   * to and books it as a brand new direct user.
   */
  clientId?: string;
  sessionId?: string;
}

/**
 * A stand-in for a buyer we cannot identify — no GA cookie, or a checkout
 * started before this was wired up. GA4 rejects an event without a client_id,
 * so the alternative to a synthetic one is losing the sale entirely. The
 * revenue is then right and the attribution is not: the purchase shows up as
 * its own direct user with no campaign behind it.
 */
const syntheticClientId = () =>
  `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;

/**
 * Report a paid Stripe event to GA4 over the Measurement Protocol. This runs
 * where the money is confirmed rather than in the browser, so it also catches
 * the buyers an ad blocker hides, the ones who close the tab on the way back
 * from Stripe, and subscription renewals, which no browser ever witnesses.
 */
export async function sendPurchaseEvent(event: PurchaseEvent): Promise<void> {
  const apiSecret = gaApiSecret.value();
  const measurementId = gaMeasurementId.value().trim();

  if (!apiSecret || !measurementId) {
    logger.warn("GA is not configured, skipping purchase event", {
      transactionId: event.transactionId,
    });
    return;
  }

  const value = (event.amountMinorUnits ?? 0) / 100;
  const currency = (event.currency || "eur").toUpperCase();

  const params: Record<string, unknown> = {
    transaction_id: event.transactionId,
    value,
    currency,
    items: [
      {
        item_id: event.item.id,
        item_name: event.item.name,
        price: value,
        quantity: 1,
      },
    ],
    // Without these two the event is not tied to the browser's session, and
    // GA4 leaves it out of the session-scoped reports.
    session_id: event.sessionId,
    engagement_time_msec: 1,
  };

  if (!event.sessionId) delete params.session_id;

  try {
    const res = await fetch(
      `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(
        measurementId
      )}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: event.clientId || syntheticClientId(),
          events: [{ name: "purchase", params }],
        }),
      }
    );

    // The Measurement Protocol answers 2xx even for a payload it then drops,
    // so this only catches transport-level trouble. Malformed events have to
    // be found with the debug endpoint.
    if (!res.ok) {
      logger.error("GA rejected the purchase event", {
        status: res.status,
        transactionId: event.transactionId,
      });
      return;
    }

    logger.info("📈 Purchase reported to GA", {
      transactionId: event.transactionId,
      value,
      currency,
      attributed: Boolean(event.clientId),
    });
  } catch (err) {
    // Analytics must never take down the webhook: Stripe would retry the
    // delivery and the customer would be mailed and persisted twice.
    logger.error("Could not report the purchase to GA", err);
  }
}
