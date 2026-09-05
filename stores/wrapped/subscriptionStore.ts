import { defineStore } from "pinia";

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
}

export const useSubscriptionStore = defineStore("subscription", {
  state: (): SubscriptionStoreState => ({
    subscription: undefined,
    isLoading: false,
    isVerified: false,
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
      return new Date(state.subscription.expiresAt) > new Date();
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
  },
  persist: {
    storage: import.meta.client ? localStorage : undefined,
  },
});
