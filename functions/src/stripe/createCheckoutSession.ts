import { HttpsError, onCall } from "firebase-functions/https";
import {
  ensureSameOrigin,
  getStripe,
  introCouponId,
  oneTimePriceId,
  proPriceId,
  stripeSecretKey,
  validateOrigin,
} from "./common";
import * as logger from "firebase-functions/logger";

interface CreateCheckoutSessionRequest {
  priceId?: string;
  mode?: "subscription" | "payment";
  successUrl?: string;
  cancelUrl?: string;
  /** GA identifiers of the browser starting this checkout, see below. */
  analytics?: { clientId?: string; sessionId?: string };
}

/**
 * The purchase is reported from the webhook, which knows the money but not the
 * visitor. Pinning the browser's GA identifiers to the Stripe objects here is
 * the only moment both are in the same place, and it is what keeps the sale
 * attributed to the campaign that brought the buyer in. Stripe metadata values
 * have to be strings, and are capped well above what these need.
 */
const analyticsMetadata = (data: CreateCheckoutSessionRequest) => {
  const metadata: Record<string, string> = {};
  const clientId = data.analytics?.clientId;
  const sessionId = data.analytics?.sessionId;

  if (typeof clientId === "string" && clientId) {
    metadata.ga_client_id = clientId.slice(0, 100);
  }
  if (typeof sessionId === "string" && sessionId) {
    metadata.ga_session_id = sessionId.slice(0, 100);
  }

  return metadata;
};

export const createCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const stripe = getStripe();

    // Validate origin from request headers
    const origin = validateOrigin(request.rawRequest.get("origin"));
    const data = (request.data || {}) as CreateCheckoutSessionRequest;
    const mode = data.mode === "payment" ? "payment" : "subscription";

    // The price is resolved here, not taken from the caller: anyone can call
    // this endpoint, and access is granted per paid invoice regardless of what
    // was paid, so a caller picking the price picks what Pro costs.
    const price =
      mode === "payment" ? oneTimePriceId.value() : proPriceId.value();

    if (!price) {
      logger.error("No price configured for checkout mode", { mode });
      throw new HttpsError("failed-precondition", "No price configured.");
    }

    if (data.priceId && data.priceId !== price) {
      throw new HttpsError(
        "invalid-argument",
        `priceId is not the configured ${mode} price.`
      );
    }

    // A Trial Offer on the product (reduced first month, then full price) is
    // not applied by Checkout — it only supports free trials via trial_end —
    // so the advertised intro month is a first-invoice coupon on the full
    // price. Renewals then bill the full price as a normal subscription_cycle.
    const introCoupon =
      mode === "subscription" ? introCouponId.value().trim() : "";

    if (mode === "subscription" && !introCoupon) {
      logger.error(
        "INTRO_COUPON_ID is not set: subscribing at full price while the site advertises a reduced first month."
      );
    }

    const defaultSuccessUrl =
      mode === "payment"
        ? `${origin}/?session_id={CHECKOUT_SESSION_ID}&payment_success=true`
        : `${origin}/subscribe?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${origin}/subscribe`;

    const success_url =
      ensureSameOrigin(data.successUrl, origin, "successUrl") ||
      defaultSuccessUrl;
    const cancel_url =
      ensureSameOrigin(data.cancelUrl, origin, "cancelUrl") || defaultCancelUrl;

    const metadata = analyticsMetadata(data);

    try {
      const session = await stripe.checkout.sessions.create({
        mode,
        line_items: [
          {
            price,
            quantity: 1,
          },
        ],
        discounts: introCoupon ? [{ coupon: introCoupon }] : undefined,
        success_url,
        cancel_url,
        metadata,
        // Renewals arrive as invoices months later, long after the checkout
        // session is gone, so the subscription has to carry its own copy.
        subscription_data: mode === "subscription" ? { metadata } : undefined,
      });

      // ❗ onCall cannot redirect → return the URL.
      return { url: session.url };
    } catch (error: any) {
      logger.error("Error creating checkout session:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
