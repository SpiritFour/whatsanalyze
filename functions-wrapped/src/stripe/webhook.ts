import { onRequest } from "firebase-functions/https";
import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import { getStripe, stripeSecretKey, stripeWebhookSecret } from "./common";
import { Customer, sendSubscriptionConfirmationEmail } from "../mail";
import { db } from "../firebase";

export const stripeWebhook = onRequest(
  { cors: false, secrets: [stripeSecretKey, stripeWebhookSecret] },
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
        await handleInvoiceForSubscription(invoice, true);
      } else if (invoice.billing_reason === "subscription_cycle") {
        logger.info("Reoccurring payment for Subscription!");
        await handleInvoiceForSubscription(invoice, false);
      } else {
        logger.info("Unknown billing reason", invoice.billing_reason);
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "payment") {
        logger.info("One time payment successfully!");
      }
    }

    res.sendStatus(200);
  }
);

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
      await sendSubscriptionConfirmationEmail(customer);
    }
  } else {
    logger.warn("Was not able to extract customer from invoice.");
    // todo send mail to us?
  }
}
