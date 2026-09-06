import { HttpsError, onCall } from "firebase-functions/https";
import { getStripe, stripeSecretKey, validateOrigin } from "./common";
import * as logger from "firebase-functions/logger";
import { db } from "../firebase";

export const createCustomerPortal = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const stripe = getStripe();

    const origin = validateOrigin(request.rawRequest.get("origin"));

    const { subscriptionId, email } = request.data;

    if (!subscriptionId || typeof subscriptionId !== "string") {
      throw new HttpsError("invalid-argument", "subscriptionId is required");
    }

    if (!email || typeof email !== "string") {
      throw new HttpsError("invalid-argument", "email is required");
    }

    try {
      const snapshot = await db
        .collection("subscriptions")
        .where("email", "==", email)
        .where("subscriptionId", "==", subscriptionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new HttpsError("not-found", "Subscription not found");
      }

      const data = snapshot.docs[0].data();
      const customerId = data.customerId as string | undefined;

      if (!customerId) {
        throw new HttpsError("failed-precondition", "Customer ID missing");
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/wrapped/subscription/verify?token=${subscriptionId}&email=${encodeURIComponent(
          email
        )}`,
      });
      return { url: portalSession.url };
    } catch (error: any) {
      logger.error("Error creating customer portal session:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", error.message);
    }
  }
);
