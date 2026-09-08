<template>
  <div class="ma-8 max-w-2xl mx-auto">
    <div v-if="subscriptionStore.isSubscriptionValid" class="my-8">
      <v-card class="pa-6" elevation="2">
        <div class="d-flex align-center mb-4">
          <v-icon color="success" size="36" class="mr-3"
            >mdi-check-circle</v-icon
          >
          <h2 class="text-h5 font-weight-bold">Your subscription is Active</h2>
        </div>

        <v-divider class="my-3"></v-divider>

        <div class="text-body-1 my-2">
          <b>Subscription ID:</b> {{ subscriptionStore.getSubscriptionId }}
        </div>
        <div v-if="subscriptionStore.getEmail" class="text-body-1 my-2">
          <b>Email:</b> {{ subscriptionStore.getEmail }}
        </div>
        <div v-if="subscriptionStore.getExpiresAt" class="text-body-1 my-2">
          <b>Expires:</b> {{ formatDate(subscriptionStore.getExpiresAt) }}
        </div>

        <v-alert
          v-if="portalError"
          type="error"
          density="compact"
          class="my-3"
          >{{ portalError }}</v-alert
        >

        <div class="d-flex flex-wrap gap-2 mt-4">
          <v-btn to="/" color="primary" class="mr-2 mb-2">
            Go to homepage and use your subscription
          </v-btn>

          <v-btn
            :loading="isPortalLoading"
            color="secondary"
            class="mr-2 mb-2"
            @click="openCustomerPortal"
          >
            Manage Subscription (Stripe Portal)
          </v-btn>

          <v-btn variant="outlined" color="error" class="mb-2" @click="logout">
            Logout
          </v-btn>
        </div>
      </v-card>
    </div>

    <div v-else class="my-8">
      <v-card class="pa-6 mb-6" elevation="2">
        <h2 class="text-h5 font-weight-bold mb-2">Buy New Subscription</h2>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Unlock unlimited PDF reports for all chats, WhatsApp Wrapped, and all
          tools.
        </p>
        <SubscribeBtn />
      </v-card>

      <v-card class="pa-6" elevation="2">
        <h2 class="text-h5 font-weight-bold mb-2">Verify or Restore Access</h2>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Enter your email and subscription ID (e.g. from your Stripe email
          receipt) to restore your access.
        </p>

        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          variant="outlined"
          density="comfortable"
          required
        />

        <v-text-field
          v-model="subscriptionId"
          label="Subscription ID"
          placeholder="sub_..."
          variant="outlined"
          density="comfortable"
          required
        />

        <v-alert v-if="error" type="error" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          density="compact"
          class="mb-4"
        >
          {{ successMessage }}
        </v-alert>

        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!email || !subscriptionId"
          @click="verify"
        >
          Verify Subscription
        </v-btn>
      </v-card>
    </div>
  </div>
</template>

<script>
import { httpsCallable } from "firebase/functions";
import { useSubscriptionStore } from "~/stores/subscription";
import { getSubscriptionParams } from "~/utils/subscription";

export default {
  name: "Subscriptions",
  data() {
    return {
      email: "",
      subscriptionId: "",
      loading: false,
      error: "",
      successMessage: "",
      isPortalLoading: false,
      portalError: "",
    };
  },
  computed: {
    subscriptionStore() {
      return useSubscriptionStore();
    },
  },
  async mounted() {
    const queryEmail = this.$route.query.email || "";
    const queryId =
      this.$route.query.token || this.$route.query.subscription_id || "";

    if (queryEmail) this.email = queryEmail;
    if (queryId) this.subscriptionId = queryId;

    if (!this.email && !this.subscriptionId) {
      const legacy = getSubscriptionParams();
      if (legacy.email) this.email = legacy.email;
      if (legacy.id) this.subscriptionId = legacy.id;
    }

    if (
      !this.subscriptionStore.isSubscriptionValid &&
      this.email &&
      this.subscriptionId
    ) {
      await this.verify();
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    async verify() {
      if (!this.email || !this.subscriptionId) {
        this.error = "Please provide both email and subscription ID.";
        return;
      }

      this.error = "";
      this.successMessage = "";
      this.loading = true;

      try {
        const result = await this.subscriptionStore.verify(
          this.email,
          this.subscriptionId
        );
        if (result.isValid) {
          this.successMessage = "Subscription successfully verified!";
        } else {
          this.error = result.message || "Subscription could not be verified.";
        }
      } catch (err) {
        this.error = err?.message || "An unexpected error occurred.";
      } finally {
        this.loading = false;
      }
    },
    async openCustomerPortal() {
      const activeEmail = this.email || this.subscriptionStore.getEmail;
      const activeSubscriptionId =
        this.subscriptionId || this.subscriptionStore.getSubscriptionId;

      if (!activeEmail || !activeSubscriptionId) {
        this.portalError = "Missing email or subscription ID.";
        return;
      }

      this.portalError = "";
      this.isPortalLoading = true;

      try {
        const functions = this.$wrappedFunctions || this.$functions;
        const createCustomerPortal = httpsCallable(
          functions,
          "createCustomerPortal"
        );

        const res = await createCustomerPortal({
          email: activeEmail,
          subscriptionId: activeSubscriptionId,
        });

        const data = res.data;
        if (!data?.url) {
          throw new Error("Stripe portal URL missing.");
        }

        window.location.href = data.url;
      } catch (err) {
        this.portalError = err?.message || "Failed to open customer portal.";
      } finally {
        this.isPortalLoading = false;
      }
    },
    logout() {
      if (!confirm("Do you really want to logout?")) return;
      this.subscriptionStore.clearSubscription();
      this.email = "";
      this.subscriptionId = "";
      this.error = "";
      this.successMessage = "";
      window.location.replace("/subscribe");
    },
  },
};
</script>
