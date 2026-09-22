/**
 * Every Cloud Function the site runs.
 *
 * Stripe sells and renews; PayPal is a single read-only endpoint left over
 * from what was sold before the move, kept only so those customers can still
 * log in. See src/paypal/verifyPaypalSubscription.ts.
 */

import { setGlobalOptions } from "firebase-functions";

// For cost control, cap how many containers may run at once. A spike is then
// served slowly rather than expensively. Per function, and overridable with
// `maxInstances` in a function's own options.
setGlobalOptions({ maxInstances: 1 });

export { stripeWebhook } from "./stripe/webhook";
export { getCheckoutSession } from "./stripe/getCheckoutSession";
export { createCheckoutSession } from "./stripe/createCheckoutSession";
export { createCustomerPortal } from "./stripe/createCustomerPortal";
export { verifySubscription } from "./stripe/verifySubscription";

export { verifyPaypalSubscription } from "./paypal/verifyPaypalSubscription";
