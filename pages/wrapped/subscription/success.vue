<template>
  <div class="container flex justify-center items-center py-16">
    <div v-if="loading" class="text-center">
      <p class="text-gray-400">Loading...</p>
    </div>

    <div
      v-else-if="result"
      class="space-y-8 flex flex-col max-w-xl justify-center w-full"
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
        <!--
          The same name /subscribe and the confirmation email give it. It used
          to be the "Verification Code" here and the "Subscription ID" there,
          so anyone copying it across had to guess which field it belonged in.
        -->
        <p>
          <strong>{{ $t("subscribePage.subscriptionIdLabel") }}:</strong>
          {{ result.subscription }}
        </p>
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

    <!--
      Anything that is not a confirmed payment: an unknown or unpaid session,
      a backend that did not answer, or the page opened on its own with no
      session at all — which used to render a header, a footer and nothing in
      between. The customer gets a way out of each of them, never the raw
      Stripe error, which told them nothing and offered nowhere to go.
    -->
    <div v-else class="space-y-6 flex flex-col max-w-xl text-center">
      <div>
        <XCircleIcon class="h-16 w-16 inline-block text-red-400" />
        <h2 class="text-2xl font-bold mt-4">{{ problem.title }}</h2>
        <p class="mt-2 text-gray-400">{{ problem.message }}</p>
      </div>

      <div class="flex gap-4 flex-wrap justify-center">
        <button
          v-if="sessionId"
          class="py-2 px-4 rounded-md text-sm bg-green-500 text-white hover:bg-green-600 text-center"
          @click="retry"
        >
          Try again
        </button>
        <NuxtLink
          :to="localePath('/subscribe')"
          class="py-2 px-4 rounded-md text-sm border-2 text-green-500 border-green-500 hover:bg-green-500 hover:text-white text-center"
        >
          Manage your subscription
        </NuxtLink>
        <NuxtLink
          :to="localePath('/wrapped')"
          class="py-2 px-4 rounded-md text-sm border-2 border-gray-600 text-gray-300 hover:bg-gray-800 text-center"
        >
          Back to WhatsApp Wrapped
        </NuxtLink>
      </div>

      <p class="text-sm text-gray-500">
        Still stuck? Write to
        <a class="text-green-500 underline" :href="supportMailto">
          info@whatsanalyze.com
        </a>
        and we will sort it out. You have not been charged twice — if money left
        your account, the subscription exists.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { httpsCallable } from "firebase/functions";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/solid";
import { useSubscriptionStore } from "~/stores/subscription";
import { analyticsEcommerce } from "~/composables/useAnalytics";

definePageMeta({
  layout: "wrapped",
});

interface CheckoutSessionResult {
  id?: string;
  subscription?: string;
  payment_status?: string;
  amount_total?: number;
  currency?: string;
  customer_details?: {
    email?: string;
  };
}

const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
// Starts true: the first render happens before the query string has been read,
// and there is nothing to say yet — least of all that the payment failed.
const loading = ref(true);
const result = ref<CheckoutSessionResult | null>(null);
const failed = ref(false);
const autoVerifying = ref(false);
const subscriptionStore = useSubscriptionStore();

const sessionId = computed(() => (route.query.session_id as string) || "");

const problem = computed(() => {
  if (!sessionId.value) {
    return {
      title: "Nothing to confirm here",
      message:
        "This page confirms a subscription right after checkout, and there is no checkout to confirm. If you have already subscribed, open your subscription to check it.",
    };
  }
  if (failed.value) {
    return {
      title: "We could not confirm your payment",
      message:
        "Stripe did not recognise this checkout. If you were charged, your subscription is safe — try again in a moment, or check it on the subscription page.",
    };
  }
  return {
    title: "This payment did not go through",
    message:
      "Stripe reports the checkout as unpaid, so no subscription was started and you have not been charged.",
  };
});

const supportMailto = computed(() => {
  const subject = "WhatsAnalyze subscription: payment not confirmed";
  const body = sessionId.value
    ? `Checkout session: ${sessionId.value}`
    : "I could not confirm my subscription.";
  return `mailto:info@whatsanalyze.com?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
});

onMounted(() => {
  if (sessionId.value) getCheckoutSessionData(sessionId.value);
  else loading.value = false;
});

const retry = () => {
  if (sessionId.value) getCheckoutSessionData(sessionId.value);
};

const getCheckoutSessionData = async (id: string) => {
  loading.value = true;
  failed.value = false;
  result.value = null;
  try {
    const nuxtApp = useNuxtApp();
    const functions = nuxtApp.$functions as any;
    const getCheckoutSession = httpsCallable(functions, "getCheckoutSession");
    const res = await getCheckoutSession({ sessionId: id });
    const session = res.data as CheckoutSessionResult;

    // An unpaid session is not a successful payment, however far through
    // checkout it got.
    if (session.payment_status !== "paid") {
      console.warn("Checkout session is not paid:", session.payment_status);
      return;
    }

    result.value = session;
    analyticsEcommerce.checkoutCompleted("subscription", "wrapped");
    // The `purchase` event belongs to the webhook — see `analytics/
    // measurementProtocol.ts`. Reporting it here too would double the revenue.
    const subId = session.subscription;
    const email = session.customer_details?.email;
    if (subId && email) {
      autoVerifying.value = true;
      // The subscription only exists once Stripe's webhook has written it,
      // which can land after this redirect.
      await subscriptionStore.verifyAfterCheckout(email, subId);
      autoVerifying.value = false;
    }
  } catch (err: unknown) {
    // Never shown to the customer: it is a Stripe internal string, and it is
    // the developer who needs it.
    console.error("Callable error:", err);
    failed.value = true;
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
