<template>
  <!--
    Goes to the subscription page rather than straight to Stripe. Checkout
    started here used to return to whatever page it was launched from, which
    is the pricing table the subscriber just paid to get rid of.
  -->
  <UiButton
    :to="localePath('/subscribe')"
    variant="secondary"
    block
    class="mt-3"
    @click="analyticsEcommerce.viewPricing('subscribe_btn')"
  >
    {{ $t("chooseSubscription") }}
  </UiButton>
</template>

<script setup>
import { analyticsEcommerce } from "~/composables/useAnalytics";

// Without this the German and French pages sent their visitors to the English
// /subscribe.
const localePath = useLocalePath();
</script>
