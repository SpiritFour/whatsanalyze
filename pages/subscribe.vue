<template>
  <div class="ma-8">

    <SubscriptionChecker :id="subscription_id" :email="email" @isValid="isValid = true"
                         @isInvalid="isValid = false" />

    <div v-if="!subscription_id" class="my-8">
      <div class="my-8">
        <h2>Buy New Subscriptions</h2>
        <SubscribeBtn class="my-2" />
      </div>

      <h2>Login via Email</h2>
      <v-text-field label="Email" v-model="email" />

      <v-btn @click="email && checkEmailSubscription()">Load Subscription</v-btn>

      <div v-if="isEmailValid">Subscription successfully loaded</div>
      <div v-else-if="isEmailValid === false">Subscription could not be found. Please enter your correct email.</div>
    </div>

    <div v-else class="my-8">
      <v-progress-circular v-if="isValid === null" indeterminate style="height: 5em" color="blue" />
      <div v-else>
        <h2>Your subscription is {{ isValid ? "Active" : "Invalid" }}</h2>

        <div v-if="isValid">
          <b>Subscription ID:</b> {{ subscription_id }}
        </div>

        <v-btn to="/" class="mt-2">
          Go to homepage and use your subscription
        </v-btn>

        <v-btn @click="logout" class="mt-2 m">
          Logout
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import SubscriptionChecker from "~/components/SubscriptionChecker.vue";
import { getSubscriptionParams } from "~/utils/subscription";

export default {
  name: "Subscriptions",
  components: { SubscriptionChecker },
  data() {
    return {
      ba_token: null,
      token: null,
      isValid: null,
      subscriptionData: null,
      APIinterval: null,
      maxCounter: 0,
      subscription_id: null,
      email: null,
      isEmailValid: null
    };
  },
  mounted() {
    const { email, id } = getSubscriptionParams();
    this.subscription_id = id;
    this.email = email;
  },
  methods: {
    logout() {
      if (!confirm("You you really want to logout?")) return;

      localStorage.setItem("subscription", JSON.stringify({}));
      /*remove query and reload*/
      window.location.replace("/subscribe");
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
