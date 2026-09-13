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
}

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
      });

      // ❗ onCall cannot redirect → return the URL.
      return { url: session.url };
    } catch (error: any) {
      logger.error("Error creating checkout session:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
