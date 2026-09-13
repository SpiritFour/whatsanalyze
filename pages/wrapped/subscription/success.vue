<template>
  <div class="container flex justify-center items-center">
    <div v-if="loading" class="text-center">
      <p class="text-gray-400">Loading...</p>
    </div>

    <div v-else-if="error" class="text-center">
      <XCircleIcon class="h-16 w-16 inline-block text-red-400" />
      <div>
        <h2 class="text-2xl font-bold mt-4">Payment Not Successful</h2>
        <p class="mt-2 text-gray-400">{{ error }}</p>
      </div>
    </div>

    <div
      v-else-if="result"
      class="space-y-8 flex flex-col max-w-xl justify-center w-fit min-w-2xl"
    >
      <div class="flex gap-2">
        <CheckCircleIcon class="h-16 w-16 inline-block text-green-400" />
        <div>
          <h2 class="text-2xl font-bold">Payment Successful!</h2>
          <p class="mt-2 text-gray-400">Thank you for your subscription.</p>
        </div>
      </div>

      <div class="text-sm space-y-2">
        <p><strong>Email:</strong> {{ result.customer_details?.email }}</p>
        <p><strong>Verification Code:</strong> {{ result.subscription }}</p>
        <p><strong>Status:</strong> {{ result.payment_status }}</p>
      </div>

      <div class="flex gap-4">
        <button
          class="py-2 px-4 rounded-md text-sm border-2 text-green-500 border-green-500 hover:bg-green-500 hover:text-white text-center"
          @click="goToVerification"
        >
          {{ autoVerifying ? "Verifying..." : "View Subscription Details" }}
        </button>
        <NuxtLink
          :to="localePath('/wrapped')"
          class="py-2 px-4 rounded-md text-sm bg-green-500 text-white hover:bg-green-600 text-center flex items-center"
        >
          Continue to Wrapped
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { httpsCallable } from "firebase/functions";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/solid";
import { useSubscriptionStore } from "~/stores/subscription";
definePageMeta({
  layout: "wrapped",
});

interface CheckoutSessionResult {
  subscription?: string;
  payment_status?: string;
  customer_details?: {
    email?: string;
  };
}

const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const loading = ref(false);
const result = ref<CheckoutSessionResult | null>(null);
const error = ref("");
const autoVerifying = ref(false);
const subscriptionStore = useSubscriptionStore();
const { trackSubscriptionCompleted } = useAnalytics();

onMounted(() => {
  const sessionId = route.query.session_id as string;
  if (sessionId) {
    getCheckoutSessionData(sessionId);
  }
});

const getCheckoutSessionData = async (sessionId: string) => {
  loading.value = true;
  try {
    const nuxtApp = useNuxtApp();
    const functions = (nuxtApp.$wrappedFunctions || nuxtApp.$functions) as any;
    const getCheckoutSession = httpsCallable(functions, "getCheckoutSession");
    const res = await getCheckoutSession({ sessionId });
    result.value = res.data as CheckoutSessionResult;
    trackSubscriptionCompleted("stripe");

    // Automatically verify into the Pinia store without requiring user click
    const subId = result.value?.subscription;
    const email = result.value?.customer_details?.email;
    if (subId && email) {
      autoVerifying.value = true;
      // The subscription only exists once Stripe's webhook has written it,
      // which can land after this redirect.
      await subscriptionStore.verifyAfterCheckout(email, subId);
      autoVerifying.value = false;
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Unknown error";
    console.error("Callable error:", err);
  } finally {
    loading.value = false;
  }
};

const goToVerification = () => {
  const subscriptionId = result.value?.subscription;
  const email = result.value?.customer_details?.email;

  if (subscriptionId && email) {
    const params = new URLSearchParams({
      token: subscriptionId,
      email: email,
    });
    router.push(localePath(`/subscribe?${params.toString()}`));
  } else {
    router.push(localePath("/subscribe"));
  }
};
</script>
