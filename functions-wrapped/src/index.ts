import { setGlobalOptions } from "firebase-functions";

// Cost control: cap how many containers may run at the same time. Traffic
// spikes degrade performance instead of scaling the bill.
setGlobalOptions({ maxInstances: 1 });

// Export Stripe functions
export { stripeWebhook } from "./stripe/webhook";
export { getCheckoutSession } from "./stripe/getCheckoutSession";
export { createCheckoutSession } from "./stripe/createCheckoutSession";
export { createCustomerPortal } from "./stripe/createCustomerPortal";
export { verifySubscription } from "./stripe/verifySubscription";
