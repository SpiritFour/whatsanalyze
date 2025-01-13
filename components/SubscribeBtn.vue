<template>
  <v-btn
    color="secondary"
    class="mt-3 mb-4"
    elevation="10"
    style="max-width: 100%"
    :loading="isLoading" @click="createSubscriptionPaypal()"
  >{{
      $t("chooseSubscription")
  }}</v-btn>
</template>

<script>
import { GTAG_PAYMENT, gtagEvent } from "~/utils/gtagValues";
export default {
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async createSubscriptionPaypal() {
      if (this.isLoading) return;
      gtagEvent('subscription_pressed', GTAG_PAYMENT)
      this.isLoading = true;
      const response = await this.$fire.functions.httpsCallable("helloworld")({
        client_id: this.$config.paypalClientId,
      });
      // call fetch with https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-2MW88471JV556644J
      if (!response.data.approveLink) {
        alert("Error opening paypal: " + response.error);
        this.isLoading = false;
      }

      location.href = response.data.approveLink;
    },
  },
};
</script>
