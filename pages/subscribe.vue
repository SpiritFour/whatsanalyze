<template>
  <div class="pa-8">
    <div v-if="!subscription_id">

      <h2>Buy New Subscriptions</h2>
      <SubscribeBtn />

      <h2>Login via Email</h2>
      <v-text-field label="Email" v-model="email" />

      <v-btn @click="checkEmailSubscription()" :disable="!email">Load Subscription</v-btn>

      <div v-if="isEmailValid">Subscription successfully loaded</div>
      <div v-else-if="isEmailValid === false">Subscription could not be found. Please enter your correct email.</div>
    </div>

    <div v-else>
      <v-progress-circular v-if="!isValid" indeterminate style="height: 5em" color="blue" />
      <div v-else>
        <h2>Use your Subscriptions</h2>

        Subscription ID: {{ subscription_id }}

        <br />
        <br />
        <v-btn to="/">
          Go Home
        </v-btn>

      </div>
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
      subscriptionData: null,
      APIinterval: null,
      maxCounter: 0,
      email: null,
      isEmailValid: null
    };
  },
  mounted() {
    this.getSubscriptionParams();
    this.checkSubscription();
  },
  methods: {
    getSubscriptionParams() {
      // query
      const queryParams = new URLSearchParams(window.location.search);
      this.subscription_id = queryParams.get("subscription_id");
      this.ba_token = queryParams.get("ba_token");
      this.token = queryParams.get("token");

      if (this.subscription_id) return;

      // local Storage
      const subscription = JSON.parse(localStorage.getItem("subscription") ?? "");

      this.email = subscription.email;
      this.subscription_id = subscription.subscriptionId;
    },
    async checkSubscription() {
      if (this.subscription_id) {
        await this.loadSubscription({ subscriptionId: this.subscription_id });

        this.APIinterval = setInterval(() => {
          /*asks be if subscription is valid*/
          if (this.isValid || this.maxCounter > 20) {
            clearInterval(this.APIinterval);
            return;
          }
          this.loadSubscription({ subscriptionId: this.subscription_id });
          this.maxCounter++;
        }, 3 * 1000);
      }
    },
    async checkEmailSubscription() {
      await this.loadSubscription({ email: this.email });

      this.isEmailValid = this.isValid;
    },
    async loadSubscription(data) {
      const response = await this.$fire.functions.httpsCallable(
        "checksubscriberstatus"
      )({
        ...data,
        client_id: this.$config.paypalClientId
      });

      this.subscriptionData = await response.data;
      this.isValid = this.subscriptionData.isValid;

      if (this.isValid) {
        localStorage.setItem("subscription", JSON.stringify(data));
        clearInterval(this.APIinterval);
      }
    }
  }
};
</script>

<style scoped></style>
