<template>
  <v-btn
    color="secondary"
    class="mt-3 mb-4"
    elevation="10"
    style="max-width: 100%"
    :loading="isLoading"
    @click="createSubscriptionPaypal()"
    >{{ $t("chooseSubscription") }}</v-btn
  >
</template>

<script>
import { GTAG_PAYMENT, gtagEvent } from "~/utils/gtagValues";
export default {
  setup() {
    const config = useRuntimeConfig();
    return { paypalClientId: config.public.paypalClientId };
  },
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async createSubscriptionPaypal() {
      if (this.isLoading) return;
      gtagEvent("subscription_pressed", GTAG_PAYMENT);
      this.isLoading = true;

      try {
        const response = await this.$firebase.callFunction("helloworld", {
          client_id: this.paypalClientId,
        });
        const approveLink = response.data?.approveLink;
        if (!approveLink) {
          throw new Error(response.data?.error || "No approval link returned");
        }

        window.location.assign(approveLink);
      } catch (error) {
        console.error("Error opening PayPal", error);
        this.$sentry?.captureException(error);
        alert("Error opening PayPal. Please try again.");
        this.isLoading = false;
      }
    },
  },
};
</script>
