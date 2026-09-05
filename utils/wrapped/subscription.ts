import { httpsCallable } from "firebase/functions";

/**
 * Requests a Stripe Checkout URL for the default subscription plan.
 */
export const fetchSubscriptionCheckoutUrl = async (): Promise<string | undefined> => {
  const createCheckoutSession = httpsCallable(
    useNuxtApp().$functions,
    "createCheckoutSession",
  );

  const config = useRuntimeConfig();
  const response = await createCheckoutSession({ priceId: config.public.stripePriceId });
  const { url } = response.data as { url?: string };

  return url;
};
