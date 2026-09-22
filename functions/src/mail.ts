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

/**
 * What the customer was charged and what happens next, straight from the
 * invoice. A recurring EU charge has to say the amount, the renewal date and
 * how to cancel — and the first invoice carries the intro coupon, so the
 * amount paid and the amount that recurs are two different numbers.
 */
export type SubscriptionBilling = {
  /** Cents actually charged for this invoice, intro discount included. */
  amountPaidCents: number;
  /** Cents charged on every renewal, before any intro discount. */
  renewalAmountCents: number;
  currency: string;
  /** Seconds since the epoch, as Stripe reports them. */
  renewsAt: number;
};

const formatAmount = (cents: number, currency: string): string =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

const formatDate = (epochSeconds: number): string =>
  new Date(epochSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function buildSubscriptionLoginUrl(customer: Customer): string {
  const params = new URLSearchParams({
    token: customer.subscriptionId,
    email: customer.email,
  });
  // Straight to the page that manages the subscription: /wrapped/subscription
  // /verify only bounces to it, which costs the reader a blank redirect page.
  return `${emailBaseUrl.value()}/subscribe?${params.toString()}`;
}

export async function sendSubscriptionConfirmationEmail(
  customer: Customer,
  billing: SubscriptionBilling
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
          amountPaid: formatAmount(billing.amountPaidCents, billing.currency),
          renewalAmount: formatAmount(
            billing.renewalAmountCents,
            billing.currency
          ),
          renewalDate: formatDate(billing.renewsAt),
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
