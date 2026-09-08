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
 * Requests a Stripe Checkout URL for the default subscription plan.
 */
export const fetchSubscriptionCheckoutUrl = async (): Promise<
  string | undefined
> => {
  const nuxtApp = useNuxtApp();
  const functions = (nuxtApp.$wrappedFunctions || nuxtApp.$functions) as any;
  const createCheckoutSession = httpsCallable(
    functions,
    "createCheckoutSession"
  );

  const config = useRuntimeConfig();
  const response = await createCheckoutSession({
    priceId: config.public.stripePriceId,
  });
  const { url } = response.data as { url?: string };

  return url;
};
