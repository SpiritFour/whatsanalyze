import { HttpsError, onCall } from "firebase-functions/https";
import { defineSecret, defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

/**
 * What is left of PayPal.
 *
 * Subscriptions were sold through PayPal until the move to Stripe. No new one
 * can be created — the plan, the webhook and the Firestore mirror are all
 * gone — but the customers who took one out still log in with their PayPal
 * subscription id, so it still has to be possible to check whether they are
 * paying. That check is a single read of PayPal's own API: the deleted
 * webhook only ever maintained a copy of what this answers with.
 *
 * When the last of these lapses, this file and `verifyPaypal` in
 * `stores/subscription.ts` go with it.
 */

const paypalClientId = defineString("PAYPAL_CLIENT_ID");
const paypalSecret = defineSecret("PAYPAL_SECRET");
/** Sandbox on the dev project, live on production. */
const paypalApiBase = defineString("PAYPAL_API_BASE", {
  default: "https://api-m.paypal.com",
});

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${paypalClientId.value()}:${paypalSecret.value()}`
  ).toString("base64");

  const response = await fetch(`${paypalApiBase.value()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!response.ok) {
    throw new Error(`PayPal rejected the credentials (${response.status})`);
  }

  const { access_token: accessToken } = (await response.json()) as {
    access_token: string;
  };
  return accessToken;
}

export const verifyPaypalSubscription = onCall(
  { cors: true, secrets: [paypalSecret] },
  async (request) => {
    const { subscriptionId } = request.data ?? {};

    if (!subscriptionId || typeof subscriptionId !== "string") {
      throw new HttpsError("invalid-argument", "subscriptionId is required");
    }

    if (!paypalClientId.value()) {
      logger.warn("PayPal is not configured, cannot verify", {
        subscriptionId,
      });
      return { isValid: false, message: "Subscription not found" };
    }

    try {
      const response = await fetch(
        `${paypalApiBase.value()}/v1/billing/subscriptions/${encodeURIComponent(
          subscriptionId
        )}`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            Accept: "application/json",
          },
        }
      );

      // A subscription id nobody recognises is a failed login, not an outage.
      if (response.status === 404) {
        return { isValid: false, message: "Subscription not found" };
      }

      if (!response.ok) {
        throw new Error(
          `PayPal subscription lookup failed (${response.status})`
        );
      }

      const subscription = (await response.json()) as {
        id?: string;
        status?: string;
        subscriber?: {
          email_address?: string;
          name?: { given_name?: string; surname?: string };
        };
        billing_info?: { next_billing_time?: string };
      };

      if (subscription.status !== "ACTIVE") {
        return {
          isValid: false,
          message:
            subscription.status === "EXPIRED"
              ? "Subscription has expired"
              : "Subscription not found",
        };
      }

      const name = subscription.subscriber?.name;
      const customerName =
        [name?.given_name, name?.surname].filter(Boolean).join(" ") ||
        undefined;

      logger.info("✅ PayPal subscription verified", { subscriptionId });

      return {
        isValid: true,
        subscriptionId: subscription.id ?? subscriptionId,
        email: subscription.subscriber?.email_address,
        customerName,
        // PayPal reports when it will next charge. The caller decides what to
        // do when it is missing.
        expiresAt: subscription.billing_info?.next_billing_time,
      };
    } catch (error: any) {
      logger.error("Error verifying PayPal subscription", {
        error: error.message,
      });
      throw new HttpsError("internal", "Error verifying subscription");
    }
  }
);
