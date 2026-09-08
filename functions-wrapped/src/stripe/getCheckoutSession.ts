import { onCall } from "firebase-functions/https";
import { getStripe, stripeSecretKey } from "./common";
import * as logger from "firebase-functions/logger";

// we use this in the FE to automatically login the user when they get redirected back from strip to us
// strip redirects them with a sessionid; with this endpoint here we can retrieve the customer info and use it to login
export const getCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const stripe = getStripe();

    const { sessionId } = request.data;

    if (!sessionId || typeof sessionId !== "string") {
      throw new Error("sessionId is required");
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // onCall must *return* results, not send JSON
      return session;
    } catch (error: any) {
      logger.error("Error retrieving checkout session:", error);
      throw new Error(error.message);
    }
  }
);
