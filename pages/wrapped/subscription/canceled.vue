<template>
  <div class="container flex flex-col justify-center items-center py-16 text-center">
    <h1 class="text-3xl font-bold mb-4">Subscription Canceled</h1>
    <p class="text-gray-400 mb-8">
      Your payment process was canceled. No charges were made.
    </p>
    <NuxtLink
      :to="localePath('/wrapped')"
      class="py-2 px-6 rounded-md text-sm border-2 text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
    >
      Return to WhatsApp Wrapped
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

definePageMeta({
  layout: "wrapped",
});

const localePath = useLocalePath();
const { trackSubscriptionCanceled } = useAnalytics();

onMounted(() => {
  trackSubscriptionCanceled();
});
</script>
