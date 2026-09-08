<template>
  <v-btn
    color="secondary"
    class="mt-3 mb-4"
    elevation="10"
    style="max-width: 100%"
    :loading="isLoading"
    @click="createSubscriptionStripe()"
    >{{ $t("chooseSubscription") }}</v-btn
  >
</template>

<script>
import { GTAG_PAYMENT, gtagEvent } from "~/utils/gtagValues";
import { fetchSubscriptionCheckoutUrl } from "~/utils/subscription";

export default {
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async createSubscriptionStripe() {
      if (this.isLoading) return;
      gtagEvent("subscription_pressed", GTAG_PAYMENT);
      this.isLoading = true;

      try {
        const url = await fetchSubscriptionCheckoutUrl();
        if (!url) {
          throw new Error("No checkout URL returned from payment service");
        }

        window.location.assign(url);
      } catch (error) {
        console.error("Error opening Stripe Checkout", error);
        this.$sentry?.captureException(error);
        alert("Error opening Checkout. Please try again.");
        this.isLoading = false;
      }
    },
  },
};
</script>
