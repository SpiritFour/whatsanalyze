<template>
    <v-btn @click="createSubscriptionPaypal()">Subscribe for unlimited use</v-btn>
</template>

<script>
export default {
  methods: {
    async createSubscriptionPaypal() {
      const response = await this.$fire.functions.httpsCallable("helloworld")({
        client_id: this.$config.paypalClientId,
      });
      // call fetch with https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-2MW88471JV556644J
      if (!response.data.approveLink) alert("Error opening paypal: " + response.error);

      location.href = response.data.approveLink;
    },
  },
};
</script>

