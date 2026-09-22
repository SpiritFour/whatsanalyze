import { onRequest } from "firebase-functions/https";
import { defineBoolean } from "firebase-functions/params";
import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import { getStripe, stripeSecretKey, stripeWebhookSecret } from "./common";
import {
  Customer,
  SubscriptionBilling,
  sendSubscriptionConfirmationEmail,
} from "../mail";
import { db } from "../firebase";
import {
  ITEM_FULL_PDF,
  ITEM_PRO_SUBSCRIPTION,
  gaApiSecret,
  sendPurchaseEvent,
} from "../analytics/measurementProtocol";

// Stripe fans an event out to every registered endpoint. While the move to the
// site's project runs, two deployments receive the same invoice and each would
// mail the customer, so the arriving one stays quiet until the old endpoint is
// gone. Both still write `subscriptions`, which keeps the mirrors in step and
// makes the switch reversible.
const sendConfirmationEmail = defineBoolean("SEND_CONFIRMATION_EMAIL", {
  default: true,
});

export const stripeWebhook = onRequest(
  {
    cors: false,
    secrets: [stripeSecretKey, stripeWebhookSecret, gaApiSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const stripe = getStripe();

    let event: Stripe.Event;
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      logger.warn("Webhook signature missing");
      res.status(400).send("Webhook signature missing");
      return;
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value()
      );
    } catch (err: any) {
      logger.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // This event is fired when we get a payment that was successfull
    if (event.type === "invoice.payment_succeeded") {
      logger.info("Payment succeeded");
      const invoice = event.data.object as Stripe.Invoice;

      // this means the subscription was not only created, but already also paid
      if (invoice.billing_reason === "subscription_create") {
        logger.info("Subscription was created and payed!");
        // store user data in db and send them an email with the login link
        await handleInvoiceForSubscription(
          invoice,
          sendConfirmationEmail.value()
        );
        await reportInvoicePurchase(invoice);
      } else if (invoice.billing_reason === "subscription_cycle") {
        logger.info("Reoccurring payment for Subscription!");
        await handleInvoiceForSubscription(invoice, false);
        // Renewals are revenue too, and this is the only place they surface:
        // nobody opens a browser to be charged for month two.
        await reportInvoicePurchase(invoice);
      } else {
        logger.info("Unknown billing reason", invoice.billing_reason);
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "payment") {
        logger.info("One time payment successfully!");
        // `completed` fires for unpaid sessions too, e.g. a delayed bank debit.
        if (session.payment_status === "paid") {
          await reportPurchase({
            transactionId: session.id,
            amountMinorUnits: session.amount_total,
            currency: session.currency,
            item: ITEM_FULL_PDF,
            metadata: session.metadata,
          });
        }
      }
    }

    res.sendStatus(200);
  }
);

/**
 * Report a paid Stripe object as a GA4 purchase, using the GA identifiers the
 * checkout pinned to it. The flag decides whether this deployment is the one
 * that speaks.
 */
async function reportPurchase({
  transactionId,
  amountMinorUnits,
  currency,
  item,
  metadata,
}: {
  transactionId: string | null;
  amountMinorUnits: number | null;
  currency: string | null;
  item: { id: string; name: string };
  metadata?: Stripe.Metadata | null;
}) {
  if (!transactionId) return;

  await sendPurchaseEvent({
    transactionId,
    amountMinorUnits,
    currency,
    item,
    clientId: metadata?.ga_client_id,
    sessionId: metadata?.ga_session_id,
  });
}

/**
 * Renewals carry the GA identifiers on the subscription, not on the invoice,
 * because the checkout session they came from is long gone.
 */
async function reportInvoicePurchase(invoice: Stripe.Invoice) {
  const subscriptionDetails = invoice.parent?.subscription_details;
  let metadata = subscriptionDetails?.metadata;

  // Stripe only copies the subscription's metadata onto the invoice for some
  // billing reasons, so fall back to asking the subscription itself.
  if (!metadata?.ga_client_id && subscriptionDetails?.subscription) {
    const subscriptionId =
      typeof subscriptionDetails.subscription === "string"
        ? subscriptionDetails.subscription
        : subscriptionDetails.subscription.id;
    try {
      const subscription = await getStripe().subscriptions.retrieve(
        subscriptionId
      );
      metadata = subscription.metadata;
    } catch (err) {
      logger.warn("Could not read GA ids off the subscription", err);
    }
  }

  await reportPurchase({
    transactionId: invoice.id ?? null,
    // What the customer actually paid, so the intro month reports as the
    // reduced price and the renewals as the full one.
    amountMinorUnits: invoice.amount_paid,
    currency: invoice.currency,
    item: ITEM_PRO_SUBSCRIPTION,
    metadata,
  });
}

function calculateExpirationDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

async function getCustomer(
  invoice: Stripe.Invoice
): Promise<Customer | undefined> {
  const stripe = getStripe();
  const customerId = invoice.customer as string;

  const customer = (await stripe.customers.retrieve(
    customerId
  )) as Stripe.Customer;

  const customerEmail = customer.email;
  const customerName = customer.name as string;
  const subscriptionId = invoice.parent?.subscription_details
    ?.subscription as string;

  if (!customerEmail) {
    logger.error(
      "We need a customer email, otherwise we can not contact them",
      customer
    );
    return;
  }
  if (!subscriptionId) {
    logger.error(
      "This invoice seems to have been triggered not by a subscription?",
      invoice
    );
    return;
  }

  return {
    name: customerName,
    email: customerEmail,
    id: customerId,
    subscriptionId,
  };
}

/**
 * The confirmation email has to quote the charge the customer just saw. The
 * first invoice runs the intro coupon against the recurring price, so
 * `amount_paid` is the reduced first month while the line's unit amount is
 * what renews — the two are read off the same invoice so they cannot drift
 * apart. If Stripe sends an invoice without line detail we fall back to the
 * undiscounted total and the same 30 days the subscription is stored with.
 */
function summarizeBilling(invoice: Stripe.Invoice): SubscriptionBilling {
  const line = invoice.lines?.data?.[0];
  const recurringAmount = line?.pricing?.unit_amount_decimal;

  return {
    amountPaidCents: invoice.amount_paid,
    renewalAmountCents:
      recurringAmount != null ? Number(recurringAmount) : invoice.subtotal,
    currency: invoice.currency,
    renewsAt:
      line?.period?.end ??
      Math.floor(calculateExpirationDate().getTime() / 1000),
  };
}

async function persistCustomer(customer: Customer) {
  // can we do also just an update of fields? so existing fields are not overwritten?
  await db.collection("subscriptions").doc(customer.id).set({
    email: customer.email,
    subscriptionId: customer.subscriptionId,
    customerId: customer.id,
    customerName: customer.name,
    expiresAt: calculateExpirationDate(),
    createdAt: new Date(),
  });
}

export async function handleInvoiceForSubscription(
  invoice: Stripe.Invoice,
  sendSubscriptionConfirmationMail: Boolean = false
) {
  const invoiceId = invoice.id;
  logger.info("🔔Payment for Subscription received!", {
    invoiceId,
  });

  const customer = await getCustomer(invoice);

  if (customer) {
    // Persist subscription to Firestore
    // if the customer was already there, we just overwrite it with a new expriation date
    await persistCustomer(customer);

    logger.info("✅ Customer persisted to Firestore", {
      id: customer.id,
      email: customer.email,
    });
    if (sendSubscriptionConfirmationMail) {
      // Send subscription confirmation email
      await sendSubscriptionConfirmationEmail(
        customer,
        summarizeBilling(invoice)
      );
    }
  } else {
    logger.warn("Was not able to extract customer from invoice.");
    // todo send mail to us?
  }
}
