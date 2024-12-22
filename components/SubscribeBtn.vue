<template>
  <v-btn @click="createSubscriptionPaypal()" :disabled="isLoading">{{ $t("subscription.button") }}</v-btn>
</template>

<script>
export default {
  data() {
    return {
      isLoading: false
    };
  },
  methods: {
    async createSubscriptionPaypal() {
      if (this.isLoading) return;

      this.isLoading = true;
      const response = await this.$fire.functions.httpsCallable("helloworld")({
        client_id: this.$config.paypalClientId
      });
      // call fetch with https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-2MW88471JV556644J
      if (!response.data.approveLink) {
        alert("Error opening paypal: " + response.error);
        this.isLoading = false;
      }

      location.href = response.data.approveLink;
    }
  }
};
</script>
