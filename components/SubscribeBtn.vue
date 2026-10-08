<template>
  <!--
    Goes to the subscription page rather than straight to Stripe. Checkout
    started here used to return to whatever page it was launched from, which
    is the pricing table the subscriber just paid to get rid of.
  -->
  <UiButton
    :to="subscribeLink"
    variant="secondary"
    block
    class="mt-3"
    @click="analyticsEcommerce.pricingCtaClick('subscribe_btn')"
  >
    {{ $t("chooseSubscription") }}
  </UiButton>
</template>

<script setup>
import { analyticsEcommerce } from "~/composables/useAnalytics";

// Localized (the German and French pages used to send their visitors to the
// English /subscribe) and carrying this page, to come back to after paying.
const subscribeLink = useSubscribeLink();
</script>
