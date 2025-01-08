<template>
</template>

<script>

export default {
  props: ["email", "id"],
  data() {
    return {
      subscription_id: null,
      isValid: null,
      subscriptionData: null,
      APIinterval: null,
      maxCounter: 0,
      isEmailValid: null
    };
  },
  watch: {
    id() {
      this.checkSubscription();
    },
    email() {
      this.checkSubscription();
    }
  },
  methods: {
    async checkSubscription() {

      if (!this.email && !this.id) {
        return;
      }

      let data = {};
      if (this.id) {
        data = { subscriptionId: this.id };
      } else {
        data = { email: this.email };
      }

      await this.loadSubscription(data);

      this.APIinterval = setInterval(() => {
        /*asks be if subscription is valid*/
        if (this.isValid || this.maxCounter > 20) {
          clearInterval(this.APIinterval);
          this.$emit("isInvalid");
          return;
        }
        this.loadSubscription(data);
        this.maxCounter++;
      }, 3 * 1000);
    },
    async loadSubscription(data) {

      console.log("Loading", data);
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
        this.$emit("isValid");
        clearInterval(this.APIinterval);
      }
    }
  }
};
</script>

<style scoped></style>
