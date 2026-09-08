import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import { db } from "./firebase";
const emailBaseUrl = defineString("EMAIL_BASE_URL");

export type Customer = {
  email: string;
  name: string;
  id: string;
  subscriptionId: string;
};

function buildSubscriptionLoginUrl(customer: Customer): string {
  const params = new URLSearchParams({
    token: customer.subscriptionId,
    email: customer.email,
  });
  return `${emailBaseUrl.value()}/wrapped/subscription/verify?${params.toString()}`;
}

export async function sendSubscriptionConfirmationEmail(
  customer: Customer
): Promise<void> {
  const { email, name } = customer;
  try {
    const loginUrl = buildSubscriptionLoginUrl(customer);
    await db.collection("mail").add({
      to: email,
      template: {
        name: "subscription-confirmation",
        data: {
          customerName: name || "Subscriber",
          loginUrl,
          subscriptionId: customer.subscriptionId,
          email,
        },
      },
    });

    logger.info("✉️ Subscription confirmation email queued", {
      email,
      name,
    });
  } catch (error: any) {
    logger.error("Error queuing subscription confirmation email", {
      email,
      error: error.message,
    });
    // Don't throw - we want to continue even if email fails
  }
}
