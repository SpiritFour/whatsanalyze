import { HttpsError, onCall } from "firebase-functions/https";
import { db } from "../firebase";
import * as logger from "firebase-functions/logger";

export interface SubscriptionLookup {
  isValid: boolean;
  message?: string;
  expiresAt?: string;
  customerName?: string;
  customerId?: string;
}

/**
 * Is this Stripe subscription paid up? Read from the Firestore mirror the
 * webhook keeps. Shared by the login below and every paid feature, so "is a
 * subscriber" means the same thing everywhere.
 */
export async function lookupSubscription(
  email: string,
  subscriptionId: string,
): Promise<SubscriptionLookup> {
  const snapshot = await db
    .collection("subscriptions")
    .where("email", "==", email)
    .where("subscriptionId", "==", subscriptionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    logger.warn("Subscription not found", { email, subscriptionId });
    return { isValid: false, message: "Subscription not found" };
  }

  const data = snapshot.docs[0].data();
  const expiresAt = data.expiresAt?.toDate?.();

  // A document without an expiry is one the webhook has not finished
  // writing. Reading through it threw, and the caller — a customer who just
  // paid and is being retried every couple of seconds — got a 500 each time.
  if (!expiresAt) {
    logger.warn("Subscription has no expiry yet", { email, subscriptionId });
    return { isValid: false, message: "Subscription not found" };
  }

  if (new Date() > expiresAt) {
    logger.warn("Subscription has expired", { email, expiresAt });
    return { isValid: false, message: "Subscription has expired" };
  }

  return {
    isValid: true,
    expiresAt: expiresAt.toISOString(),
    customerName: data.customerName,
    customerId: data.customerId,
  };
}

// this is our "login" function
// todo we should use customerId and email isntead of subscriptionId
export const verifySubscription = onCall({ cors: true }, async (request) => {
  const { email, subscriptionId } = request.data;

  if (!email || typeof email !== "string") {
    throw new HttpsError("invalid-argument", "email is required");
  }

  if (!subscriptionId || typeof subscriptionId !== "string") {
    throw new HttpsError("invalid-argument", "subscriptionId is required");
  }

  try {
    const result = await lookupSubscription(email, subscriptionId);
    if (result.isValid) logger.info("✅ Subscription verified", { email });
    return result;
  } catch (error: any) {
    logger.error("Error verifying subscription", { error: error.message });
    throw new HttpsError("internal", "Error verifying subscription");
  }
});
