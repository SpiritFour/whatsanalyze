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

/**
 * PayPal subscription ids look like "I-XBCXVY6FXX47", Stripe's like "sub_...".
 * Customers who subscribed before the move to Stripe still log in with the
 * PayPal one, so the id decides which backend can answer for it.
 */
const PAYPAL_SUBSCRIPTION_ID = /^I-[A-Z0-9]+$/i;

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
    /**
     * Sign out for good. Clearing the state is not enough: the persisted copy
     * is written on a later tick, so navigating away right after beats it and
     * the next load restores the subscription that was just logged out of.
     */
    logout() {
      this.clearSubscription();
      if (import.meta.client) localStorage.removeItem("subscription");
    },
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },
    async verify(
      email: string,
      subscriptionId: string,
    ): Promise<{
      isValid: boolean;
      message?: string;
      customerName?: string;
      expiresAt?: string;
      customerId?: string;
    }> {
      if (PAYPAL_SUBSCRIPTION_ID.test(subscriptionId.trim())) {
        return this.verifyPaypal(email, subscriptionId.trim());
      }

      this.setLoading(true);
      try {
        const nuxtApp = useNuxtApp();
        const functions = nuxtApp.$functions as any;
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
     * Verify a subscription that was taken out through PayPal, before the move
     * to Stripe. Those were never written to the Stripe collection that
     * verifySubscription reads, so they are checked against PayPal directly.
     */
    async verifyPaypal(email: string, subscriptionId: string) {
      this.setLoading(true);
      try {
        const nuxtApp = useNuxtApp();
        const callable = httpsCallable(
          nuxtApp.$functions as any,
          "verifyPaypalSubscription",
        );
        // By id only. The email is what the visitor typed; the authoritative
        // one comes back from PayPal.
        const res = await callable({ subscriptionId });
        const data = res.data as {
          isValid: boolean;
          message?: string;
          subscriptionId?: string;
          email?: string;
          customerName?: string;
          expiresAt?: string;
        };

        if (!data?.isValid) {
          this.clearSubscription();
          return {
            isValid: false,
            message: data?.message || "Subscription not found",
          };
        }

        // PayPal reports the next billing date. When it is missing we still
        // let an active subscriber in, on the same 30 day window the Stripe
        // webhook grants, rather than locking out someone who is paying.
        const nextBilling = new Date(data.expiresAt ?? "");
        const expiresAt = Number.isNaN(nextBilling.getTime())
          ? new Date(Date.now() + 30 * 24 * 3600 * 1000)
          : nextBilling;

        this.setSubscription({
          email: data.email || email,
          subscriptionId: data.subscriptionId || subscriptionId,
          customerName: data.customerName,
          expiresAt: expiresAt.toISOString(),
        });

        return { isValid: true, expiresAt: expiresAt.toISOString() };
      } catch (error: any) {
        console.error("Failed to verify PayPal subscription:", error);
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
     * but the redirect is immediate, so a single failure says nothing yet:
     * "not found" and a backend that raced the webhook are both "not there
     * yet". Only a subscription that is there, or one that has expired, is a
     * final answer.
     */
    async verifyAfterCheckout(
      email: string,
      subscriptionId: string,
      attempts = 6,
      delayMs = 2500,
    ) {
      const isFinalAnswer = (result: { isValid: boolean; message?: string }) =>
        result.isValid || /expired/i.test(result.message || "");

      let result = await this.verify(email, subscriptionId);

      for (let attempt = 1; attempt < attempts; attempt++) {
        if (isFinalAnswer(result)) break;
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
