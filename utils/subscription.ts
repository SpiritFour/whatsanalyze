import { httpsCallable } from "firebase/functions";

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
  const functions = (nuxtApp.$wrappedFunctions || nuxtApp.$functions) as any;
  const createCheckoutSession = httpsCallable(
    functions,
    "createCheckoutSession"
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
  });
  const { url } = response.data as { url?: string };

  return url;
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
