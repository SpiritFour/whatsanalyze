import { HttpsError, onCall } from "firebase-functions/https";
import { db } from "../firebase";
import * as logger from "firebase-functions/logger";

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
    const snapshot = await db
      .collection("subscriptions")
      .where("email", "==", email)
      .where("subscriptionId", "==", subscriptionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.warn("Subscription not found", { email, subscriptionId });
      return {
        isValid: false,
        message: "Subscription not found",
      };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check if subscription has not expired
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();

    if (now > expiresAt) {
      logger.warn("Subscription has expired", { email, expiresAt });
      return {
        isValid: false,
        message: "Subscription has expired",
      };
    }

    logger.info("✅ Subscription verified", { email });
    return {
      isValid: true,
      expiresAt: expiresAt.toISOString(),
      customerName: data.customerName,
      customerId: data.customerId,
    };
  } catch (error: any) {
    logger.error("Error verifying subscription", { error: error.message });
    throw new HttpsError("internal", "Error verifying subscription");
  }
});
