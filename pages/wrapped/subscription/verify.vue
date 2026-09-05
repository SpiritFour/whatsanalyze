<template>
  <div class="container flex flex-col justify-center items-center">
    <div v-if="verified === null" class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold">Verify Your Subscription</h2>
        <p class="mt-2 text-center text-sm">
          Enter your email and verification code to access your subscription.
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleVerification">
        <div>
          <label class="block text-sm font-medium" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            :readonly="!!route.query.email"
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm disabled:bg-gray-100"
            placeholder="your@email.com"
            required
            type="email"
          />
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium" for="token">
              Verification Code
            </label>
            <p v-if="!route.query.token" class="mt-1 text-xs text-gray-400">
              You have got an email with this code
            </p>
          </div>
          <input
            id="token"
            v-model="subscriptionId"
            :readonly="!!route.query.token"
            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm disabled:bg-gray-100 break-all"
            placeholder="Enter verification code"
            required
            type="text"
          />
        </div>

        <p v-if="error" class="text-sm text-red-700">{{ error }}</p>

        <button
          :disabled="loading"
          class="py-2 px-4 rounded-md text-sm border-2 text-green-500 border-green-500 hover:bg-green-500 hover:text-white w-full text-center"
          type="submit"
        >
          {{ loading ? "Verifying..." : "Verify Subscription" }}
        </button>
      </form>
    </div>

    <div
      v-else-if="verified"
      class="space-y-8 flex flex-col max-w-xl justify-center w-fit min-w-2xl"
    >
      <div class="flex gap-2">
        <CheckCircleIcon class="h-16 w-16 inline-block text-green-400" />
        <div>
          <h2 class="text-2xl font-bold">Subscription Verified!</h2>
          <p class="text-gray-400">Your subscription is active and valid.</p>
        </div>
      </div>

      <div v-if="verificationData" class="text-sm space-y-2">
        <p v-if="email"><b>Email:</b> {{ email }}</p>
        <p v-if="verificationData.customerName">
          <b>Name:</b> {{ verificationData.customerName }}
        </p>
        <p><b>Expires:</b> {{ formatDate(verificationData.expiresAt) }}</p>
      </div>

      <div
        class="w-full rounded-lg border border-green-500/30 bg-green-50/20 p-5 space-y-3"
      >
        <div>
          <p class="text-sm font-semibold">
            {{ t("home.subscription.manage.title") }}
          </p>
          <p class="text-sm text-gray-500">
            {{ t("home.subscription.manage.description") }}
          </p>
        </div>
        <button
          :disabled="isPortalLoading"
          class="py-2 px-4 rounded-md text-sm border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed w-full"
          type="button"
          @click="openCustomerPortal"
        >
          {{
            isPortalLoading
              ? t("home.subscription.manage.buttonLoading")
              : t("home.subscription.manage.button")
          }}
        </button>
        <p v-if="portalError" class="text-sm text-red-700">
          {{ portalError }}
        </p>
      </div>

      <NuxtLink
        class="py-2 px-4 rounded-md text-sm border-2 text-green-500 border-green-500 hover:bg-green-500 hover:text-white w-80 text-center"
        :to="localePath('/wrapped')"
      >
        Continue to App
      </NuxtLink>
    </div>

    <div v-else class="text-center space-y-6">
      <XCircleIcon class="h-16 w-16 inline-block text-red-400" />

      <div>
        <h2 class="text-2xl font-bold">Verification Failed</h2>
        <p class="mt-2">{{ error }}</p>
      </div>

      <button
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-200"
        @click="resetVerification"
      >
        Try Again
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { httpsCallable } from "firebase/functions";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/solid";
import { useI18n } from "vue-i18n";
import { useSubscriptionStore } from "~/stores/wrapped/subscriptionStore";

definePageMeta({
  layout: "wrapped",
});

interface VerificationResult {
  isValid: boolean;
  message?: string;
  customerName?: string;
  expiresAt: string;
  customerId?: string;
}

const route = useRoute();
const localePath = useLocalePath();
const subscriptionStore = useSubscriptionStore();
const loading = ref(false);
const email = ref("");
const subscriptionId = ref("");
const verified = ref<boolean | null>(null);
const error = ref("");
const verificationData = ref<VerificationResult | null>(null);
const isPortalLoading = ref(false);
const portalError = ref("");
const { t } = useI18n();

onMounted(async () => {
  subscriptionId.value = (route.query.token as string) || "";
  email.value = (route.query.email as string) || "";

  if (subscriptionStore.isSubscriptionValid) {
    verified.value = true;
    const sub = subscriptionStore.getSubscription;
    if (sub) {
      verificationData.value = {
        isValid: true,
        customerName: sub.customerName,
        expiresAt: sub.expiresAt,
        customerId: sub.customerId,
      };
    }
    email.value = subscriptionStore.getEmail || "";
    subscriptionId.value = subscriptionStore.getSubscriptionId || "";
    return;
  }

  if (subscriptionId.value && email.value) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleVerification();
  }
});

const handleVerification = async () => {
  if (!email.value || !subscriptionId.value) {
    error.value = "Please enter both email and verification code";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const verifySubscription = httpsCallable(
      useNuxtApp().$functions,
      "verifySubscription"
    );

    const res = await verifySubscription({
      email: email.value,
      subscriptionId: subscriptionId.value,
    });

    const data = res.data as VerificationResult;

    if (data.isValid) {
      verified.value = true;
      verificationData.value = data;
      subscriptionStore.setSubscription({
        email: email.value,
        subscriptionId: subscriptionId.value,
        customerName: data.customerName,
        expiresAt: data.expiresAt,
        customerId: data.customerId,
      });
    } else {
      verified.value = false;
      error.value = data.message || "Subscription verification failed";
    }
  } catch (err: unknown) {
    verified.value = false;
    error.value =
      err instanceof Error ? err.message : "An error occurred during verification";
    console.error("Verification error:", err);
  } finally {
    loading.value = false;
  }
};

const resetVerification = () => {
  verified.value = null;
  error.value = "";
  email.value = "";
  subscriptionId.value = "";
  subscriptionStore.clearSubscription();
  portalError.value = "";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const openCustomerPortal = async () => {
  const activeEmail = email.value || subscriptionStore.getEmail;
  const activeSubscriptionId =
    subscriptionId.value || subscriptionStore.getSubscriptionId;

  if (!activeEmail || !activeSubscriptionId) {
    portalError.value = t("home.subscription.manage.missingDetails");
    return;
  }

  portalError.value = "";
  isPortalLoading.value = true;

  try {
    const createCustomerPortal = httpsCallable(
      useNuxtApp().$functions,
      "createCustomerPortal"
    );

    const res = await createCustomerPortal({
      email: activeEmail,
      subscriptionId: activeSubscriptionId,
    });

    const data = res.data as { url?: string };
    if (!data?.url) {
      throw new Error("Stripe portal URL missing.");
    }

    window.location.href = data.url;
  } catch (err: unknown) {
    portalError.value =
      err instanceof Error
        ? err.message
        : t("home.subscription.manage.portalError");
    console.error("Customer portal error:", err);
  } finally {
    isPortalLoading.value = false;
  }
};
</script>
