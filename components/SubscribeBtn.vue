<template>
  <!--
    Goes to the subscription page rather than straight to Stripe. Checkout
    started here used to return to whatever page it was launched from, which
    is the pricing table the subscriber just paid to get rid of.
  -->
  <v-btn
    color="secondary"
    class="mt-3 mb-4"
    elevation="10"
    style="max-width: 100%"
    to="/subscribe"
    @click="gtagEvent('subscription_pressed', GTAG_PAYMENT)"
    >{{ $t("chooseSubscription") }}</v-btn
  >
</template>

<script>
import { GTAG_PAYMENT, gtagEvent } from "~/utils/gtagValues";

export default {
  data() {
    return { GTAG_PAYMENT };
  },
  methods: { gtagEvent },
};
</script>
