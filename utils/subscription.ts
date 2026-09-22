import { httpsCallable } from "firebase/functions";
import { getAnalyticsIds } from "~/composables/useAnalytics";

export const getSubscriptionParams = () => {
  if (typeof window === "undefined") return { id: null, email: null };
  // query
  const queryParams = new URLSearchParams(window.location.search);
  const id =
    queryParams.get("token") ||
    queryParams.get("subscription_id") ||
    queryParams.get("session_id");

  if (id) return { id, email: queryParams.get("email") };
  const data = localStorage.getItem("subscription");
  // local Storage
  if (!data) return { id: null, email: null };
  try {
    const subscription = JSON.parse(data);
    return { email: subscription.email, id: subscription.subscriptionId };
  } catch {
    return { id: null, email: null };
  }
};

/**
 * Requests a Stripe Checkout URL for subscription or one-time payment.
 */
export const fetchSubscriptionCheckoutUrl = async (options?: {
  priceId?: string;
  mode?: "subscription" | "payment";
  successUrl?: string;
  cancelUrl?: string;
}): Promise<string | undefined> => {
  const nuxtApp = useNuxtApp();
  const functions = nuxtApp.$functions as any;
  const createCheckoutSession = httpsCallable(
    functions,
    "createCheckoutSession",
  );

  const config = useRuntimeConfig();
  const isOneTime = options?.mode === "payment";
  const defaultPriceId = isOneTime
    ? config.public.stripeOneTimePriceId
    : config.public.stripePriceId;

  const response = await createCheckoutSession({
    priceId: options?.priceId || defaultPriceId,
    mode: options?.mode || "subscription",
    successUrl: options?.successUrl,
    cancelUrl: options?.cancelUrl,
    // Sent along so the webhook can attribute the sale it reports. This is the
    // last moment the browser and the payment are in the same place.
    analytics: getAnalyticsIds(),
  });
  const { url } = response.data as { url?: string };

  return url;
};

/**
 * Subscription checkout started from inside Wrapped. Without these URLs the
 * backend falls back to `/subscribe`, and someone who paid from Wrapped is
 * dropped on the generic subscribe page instead of the Wrapped success page
 * that exists for exactly this.
 */
export const fetchWrappedCheckoutUrl = async (): Promise<
  string | undefined
> => {
  const localePath = useLocalePath();
  const { origin } = window.location;

  return fetchSubscriptionCheckoutUrl({
    successUrl: `${origin}${localePath(
      "/wrapped/subscription/success",
    )}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}${localePath("/wrapped/subscription/canceled")}`,
  });
};

/**
 * One-time checkout helper.
 */
export const fetchOneTimeCheckoutUrl = async (options?: {
  successUrl?: string;
  cancelUrl?: string;
}): Promise<string | undefined> => {
  return fetchSubscriptionCheckoutUrl({
    mode: "payment",
    successUrl: options?.successUrl,
    cancelUrl: options?.cancelUrl,
  });
};
