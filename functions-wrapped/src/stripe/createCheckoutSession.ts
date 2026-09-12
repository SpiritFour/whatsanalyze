import { HttpsError, onCall } from "firebase-functions/https";
import {
  ensureSameOrigin,
  getStripe,
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
    const price = data.priceId || proPriceId.value();

    const defaultSuccessUrl =
      mode === "payment"
        ? `${origin}/?session_id={CHECKOUT_SESSION_ID}&payment_success=true`
        : `${origin}/subscribe?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${origin}/subscribe`;

    const success_url =
      ensureSameOrigin(data.successUrl, origin, "successUrl") ||
      defaultSuccessUrl;
    const cancel_url =
      ensureSameOrigin(data.cancelUrl, origin, "cancelUrl") ||
      defaultCancelUrl;

    try {
      const session = await stripe.checkout.sessions.create({
        mode,
        line_items: [
          {
            price,
            quantity: 1,
          },
        ],
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
