import { defineStore } from "pinia";
import { httpsCallable } from "firebase/functions";

export interface SubscriptionData {
  email: string;
  subscriptionId: string;
  customerName?: string;
  expiresAt: string;
  customerId?: string;
}

interface SubscriptionStoreState {
  subscription: SubscriptionData | undefined;
  isLoading: boolean;
  isVerified: boolean;
  /** Waiting for Stripe's webhook to create the subscription after checkout. */
  isActivating: boolean;
}

export const useSubscriptionStore = defineStore("subscription", {
  state: (): SubscriptionStoreState => ({
    subscription: undefined,
    isLoading: false,
    isVerified: false,
    isActivating: false,
  }),
  getters: {
    getSubscription(state: SubscriptionStoreState) {
      return state.subscription;
    },
    getEmail(state: SubscriptionStoreState) {
      return state.subscription?.email;
    },
    getSubscriptionId(state: SubscriptionStoreState) {
      return state.subscription?.subscriptionId;
    },
    getExpiresAt(state: SubscriptionStoreState) {
      return state.subscription?.expiresAt;
    },
    getCustomerId(state: SubscriptionStoreState) {
      return state.subscription?.customerId;
    },
    isSubscriptionValid(state: SubscriptionStoreState): boolean {
      if (!state.subscription?.expiresAt) return false;
      return (
        state.isVerified && new Date(state.subscription.expiresAt) > new Date()
      );
    },
  },
  actions: {
    setSubscription(subscription: SubscriptionData) {
      this.subscription = subscription;
      this.isVerified = true;
    },
    clearSubscription() {
      this.subscription = undefined;
      this.isVerified = false;
    },
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },
    async verify(
      email: string,
      subscriptionId: string
    ): Promise<{
      isValid: boolean;
      message?: string;
      customerName?: string;
      expiresAt?: string;
      customerId?: string;
    }> {
      this.setLoading(true);
      try {
        const nuxtApp = useNuxtApp();
        const functions = (nuxtApp.$wrappedFunctions ||
          nuxtApp.$functions) as any;
        const verifyCallable = httpsCallable(functions, "verifySubscription");
        const res = await verifyCallable({ email, subscriptionId });
        const data = res.data as {
          isValid: boolean;
          message?: string;
          customerName?: string;
          expiresAt?: string;
          customerId?: string;
        };

        if (data.isValid && data.expiresAt) {
          this.setSubscription({
            email,
            subscriptionId,
            customerName: data.customerName,
            expiresAt: data.expiresAt,
            customerId: data.customerId,
          });
        } else {
          this.clearSubscription();
        }
        return data;
      } catch (error: any) {
        console.error("Failed to verify subscription:", error);
        return {
          isValid: false,
          message: error?.message || "Error verifying subscription",
        };
      } finally {
        this.setLoading(false);
      }
    },
    /**
     * Verify right after checkout, where the subscription only exists once
     * Stripe's webhook has written it. Stripe usually delivers within seconds,
     * but the redirect is immediate, so a single "not found" says nothing yet.
     * Only that answer is retried — an expired subscription is a final answer.
     */
    async verifyAfterCheckout(
      email: string,
      subscriptionId: string,
      attempts = 6,
      delayMs = 2500
    ) {
      let result = await this.verify(email, subscriptionId);

      for (let attempt = 1; attempt < attempts; attempt++) {
        if (result.isValid || !/not found/i.test(result.message || "")) break;
        this.isActivating = true;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        result = await this.verify(email, subscriptionId);
      }

      this.isActivating = false;
      return result;
    },
  },
  persist: {
    // Only the subscription itself outlives the tab. Persisting the transient
    // flags brings a page back stuck mid-verification after a reload.
    pick: ["subscription", "isVerified"],
    storage: import.meta.client ? localStorage : undefined,
  },
});
