import { HttpsError, onCall } from "firebase-functions/https";
import { getStripe, stripeSecretKey, validateOrigin } from "./common";
import * as logger from "firebase-functions/logger";

// we use this in the FE to automatically login the user when they get redirected back from strip to us
// strip redirects them with a sessionid; with this endpoint here we can retrieve the customer info and use it to login
export const getCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const stripe = getStripe();

    validateOrigin(request.rawRequest.get("origin"));

    const { sessionId } = request.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new HttpsError("invalid-argument", "sessionId is required");
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Only what the frontend needs to log the customer in and confirm the
      // payment. The session itself carries the billing address, phone number
      // and payment details, and anyone holding a session id can call this.
      return {
        mode: session.mode,
        payment_status: session.payment_status,
        subscription:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id,
        customer_details: {
          email: session.customer_details?.email,
          name: session.customer_details?.name,
        },
      };
    } catch (error: any) {
      logger.error("Error retrieving checkout session:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
