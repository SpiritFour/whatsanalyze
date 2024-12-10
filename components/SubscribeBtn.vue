<template>
    <v-btn @click="createSubscriptionPaypal()">Subscribe for unlimited use</v-btn>
</template>

<script>
export default {
  methods: {
    async createSubscriptionPaypal() {
      // call fetch with https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-2MW88471JV556644J
      // const response = await fetch("https://helloworld-ypb2zslcea-uc.a.run.app", {
      const response = await fetch("http://localhost:5001/whatsanalyze-80665/us-central1/helloworld", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })
      const data = await  response.json();
      if (!data.approveLink) alert("Error opening paypal: " + data.error);

      location.href = data.approveLink;
    },
  },
};
</script>

