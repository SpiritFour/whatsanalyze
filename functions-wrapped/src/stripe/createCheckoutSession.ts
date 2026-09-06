import { HttpsError, onCall } from "firebase-functions/https";
import {
  getStripe,
  proPriceId,
  stripeSecretKey,
  validateOrigin,
} from "./common";
import * as logger from "firebase-functions/logger";

export const createCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const stripe = getStripe();

    // Validate origin from request headers
    const origin = validateOrigin(request.rawRequest.get("origin"));

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: proPriceId.value(),
            quantity: 1,
          },
        ],
        success_url: `${origin}/wrapped/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/wrapped`,
      });
      // ❗ onCall cannot redirect → return the URL.
      return { url: session.url };
    } catch (error: any) {
      logger.error("Error creating checkout session:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
