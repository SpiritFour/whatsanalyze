<template>
  <div class="pa-8">

    <div v-if="!subscription_id">
      Create new subscription:
      <br />
      <SubscribeBtn />
    </div>

    <div v-else>
      Subscription ID: {{ subscription_id }}
      <br />
      Valid: {{ isValid === null ? "unknown" : isValid }}
      <br />
      Subscription data: {{ subscriptionData }}
    </div>
  </div>
</template>

<script>
export default {
  name: "Subscriptions",
  data() {
    return {
      subscription_id: null,
      ba_token: null,
      token: null,
      isValid: null,
      subscriptionData: null
    };
  },
  mounted() {
    this.getQueryParams();

    if (this.subscription_id) {
      this.loadSubscription();
    }
  },
  methods: {
    getQueryParams() {
      const queryParams = new URLSearchParams(window.location.search);
      this.subscription_id = queryParams.get("subscription_id");
      this.ba_token = queryParams.get("ba_token");
      this.token = queryParams.get("token");
    },
    async loadSubscription() {
      const response = await fetch("TODO API_LINK", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          subscription_id: this.subscription_id
        })
      });

      this.subscriptionData = await response.json();
      this.isValid = this.subscriptionData.valid;
    }
  }
};
</script>

<style scoped>

</style>
