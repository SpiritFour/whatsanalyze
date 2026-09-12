<template>
  <div class="sub-page">
    <div class="sub-page__container">
      <!-- Top header branding -->
      <div class="sub-page__header text-center">
        <span class="sub-badge">WhatsAnalyze Pro</span>
        <h1 class="sub-title">One Subscription. Everything Unlocked.</h1>
        <p class="sub-subtitle">
          Enjoy unlimited full PDF exports, WhatsApp Wrapped stories, and
          advanced chat analytics across every device.
        </p>
      </div>

      <!-- State: Active Verified Subscription -->
      <div
        v-if="subscriptionStore.isSubscriptionValid"
        class="apple-card active-card"
      >
        <div class="active-card__hero">
          <div class="active-badge-icon">
            <svg
              class="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h2 class="card-heading">Your subscription is Active</h2>
            <p class="card-subtext">
              You have full access to all features and unlimited PDF downloads.
            </p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Subscription ID</span>
            <span class="meta-value mono">{{
              subscriptionStore.getSubscriptionId
            }}</span>
          </div>
          <div v-if="subscriptionStore.getEmail" class="meta-item">
            <span class="meta-label">Linked Email</span>
            <span class="meta-value">{{ subscriptionStore.getEmail }}</span>
          </div>
          <div v-if="subscriptionStore.getExpiresAt" class="meta-item">
            <span class="meta-label">Valid Until</span>
            <span class="meta-value">{{
              formatDate(subscriptionStore.getExpiresAt)
            }}</span>
          </div>
        </div>

        <p v-if="portalError" class="error-banner">{{ portalError }}</p>

        <div class="actions-row">
          <NuxtLink to="/" class="primary-btn"> Open Chat Analyzer </NuxtLink>
          <NuxtLink to="/wrapped" class="secondary-btn">
            Open WhatsApp Wrapped
          </NuxtLink>
          <button
            class="secondary-btn"
            :disabled="isPortalLoading"
            @click="openCustomerPortal"
          >
            {{ isPortalLoading ? "Opening..." : "Manage Subscription" }}
          </button>
          <button class="text-btn text-danger" @click="logout">Logout</button>
        </div>
      </div>

      <!-- State: No Active Subscription -->
      <div v-else class="space-y-8">
        <p v-if="subscriptionStore.isActivating" class="activating-banner">
          Payment received — activating your subscription. This takes a few
          seconds.
        </p>

        <!-- Pricing / Plan Tier Card -->
        <div class="apple-card highlight-card">
          <div class="plan-header">
            <div>
              <span class="plan-tier">Pro Access</span>
              <h2 class="plan-name">WhatsAnalyze All-Access</h2>
            </div>
            <div class="plan-price">
              <span class="currency">€</span><span class="amount">4,99</span>
              <span class="interval">first month</span>
              <div class="follow-on">then €10 / month</div>
            </div>
          </div>

          <div class="feature-list">
            <div class="feature-item">
              <div class="check-icon">✓</div>
              <div>
                <strong>Unlimited Full Chat PDF Exports</strong>
                <p>
                  Export whole chat histories with full message logs, media
                  timestamps, and metadata.
                </p>
              </div>
            </div>
            <div class="feature-item">
              <div class="check-icon">✓</div>
              <div>
                <strong>Complete WhatsApp Wrapped Experience</strong>
                <p>
                  Unlock all wrapped slides, emotional analytics, top phrases,
                  and shareable stories.
                </p>
              </div>
            </div>
            <div class="feature-item">
              <div class="check-icon">✓</div>
              <div>
                <strong>Full Privacy Guarantee</strong>
                <p>
                  Client-side processing. Your chat files and messages are never
                  stored on our servers.
                </p>
              </div>
            </div>
            <div class="feature-item">
              <div class="check-icon">✓</div>
              <div>
                <strong>Self-Service Billing Portal</strong>
                <p>
                  Cancel or pause anytime with 1-click via the secure Stripe
                  Customer Portal.
                </p>
              </div>
            </div>
          </div>

          <div class="checkout-action text-center mt-6">
            <button
              class="primary-btn checkout-btn"
              :disabled="isCheckoutLoading"
              @click="startSubscriptionCheckout"
            >
              {{
                isCheckoutLoading
                  ? "Redirecting to Stripe..."
                  : "Subscribe Now with Stripe"
              }}
            </button>
            <p class="secure-tag mt-2">
              🔒 Encrypted Stripe 256-bit checkout. Cancel anytime.
            </p>
          </div>
        </div>

        <!-- Restore / Login Card -->
        <div class="apple-card">
          <h3 class="card-heading">Restore or Verify Existing Access</h3>
          <p class="card-subtext mb-4">
            Already subscribed? Enter your email and subscription ID (from your
            receipt email) to activate on this device.
          </p>

          <form class="restore-form" @submit.prevent="verify()">
            <div class="input-group">
              <label for="sub-email">Email Address</label>
              <input
                id="sub-email"
                v-model="email"
                type="email"
                placeholder="your@email.com"
                required
                class="apple-input"
              />
            </div>

            <div class="input-group">
              <label for="sub-id">Subscription ID</label>
              <input
                id="sub-id"
                v-model="subscriptionId"
                type="text"
                placeholder="sub_..."
                required
                class="apple-input mono"
              />
            </div>

            <p v-if="error" class="error-banner">{{ error }}</p>
            <p v-if="successMessage" class="success-banner">
              {{ successMessage }}
            </p>

            <button
              type="submit"
              class="secondary-btn w-full"
              :disabled="loading || !email || !subscriptionId"
            >
              {{ loading ? "Verifying with Stripe..." : "Verify Access" }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { httpsCallable } from "firebase/functions";
import { useSubscriptionStore } from "~/stores/subscription";
import {
  getSubscriptionParams,
  fetchSubscriptionCheckoutUrl,
} from "~/utils/subscription";

export default {
  name: "Subscriptions",
  data() {
    return {
      email: "",
      subscriptionId: "",
      loading: false,
      isCheckoutLoading: false,
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
      this.$route.query.token ||
      this.$route.query.subscription_id ||
      this.$route.query.session_id ||
      "";

    if (queryEmail) this.email = queryEmail;
    if (queryId) this.subscriptionId = queryId;

    if (!this.email && !this.subscriptionId) {
      const legacy = getSubscriptionParams();
      if (legacy.email) this.email = legacy.email;
      if (legacy.id) this.subscriptionId = legacy.id;
    }

    // Automatically verify on arrival if parameters are present in URL
    if (
      !this.subscriptionStore.isSubscriptionValid &&
      (this.subscriptionId || (this.email && this.subscriptionId))
    ) {
      await this.autoVerifyFromParams();
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
    async startSubscriptionCheckout() {
      if (this.isCheckoutLoading) return;
      this.isCheckoutLoading = true;
      try {
        const url = await fetchSubscriptionCheckoutUrl({
          successUrl: `${window.location.origin}/subscribe?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/subscribe`,
        });
        if (!url) throw new Error("No checkout URL returned");
        window.location.assign(url);
      } catch (err) {
        console.error("Error starting checkout:", err);
        alert("Unable to start checkout. Please try again.");
        this.isCheckoutLoading = false;
      }
    },
    async autoVerifyFromParams() {
      // If we only have session_id from checkout return, resolve details first
      const sessionId = this.$route.query.session_id;
      if (sessionId && !this.email) {
        try {
          this.loading = true;
          const functions = this.$wrappedFunctions || this.$functions;
          const getCheckoutSession = httpsCallable(
            functions,
            "getCheckoutSession"
          );
          const res = await getCheckoutSession({ sessionId });
          const session = res.data;
          if (session?.subscription) {
            this.subscriptionId = session.subscription;
          }
          if (session?.customer_details?.email) {
            this.email = session.customer_details.email;
          }
        } catch (err) {
          console.warn("Could not retrieve checkout session details:", err);
        } finally {
          this.loading = false;
        }
      }

      if (this.email && this.subscriptionId) {
        // Coming back from checkout the subscription may not be stored yet, so
        // wait for Stripe's webhook instead of telling a paying customer that
        // their subscription does not exist.
        await this.verify({ afterCheckout: Boolean(sessionId) });
      }
    },
    async verify({ afterCheckout = false } = {}) {
      if (!this.email || !this.subscriptionId) {
        this.error = "Please enter both email and subscription ID.";
        return;
      }

      this.error = "";
      this.successMessage = "";
      this.loading = true;

      try {
        const result = afterCheckout
          ? await this.subscriptionStore.verifyAfterCheckout(
              this.email,
              this.subscriptionId
            )
          : await this.subscriptionStore.verify(
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

<style scoped>
.sub-page {
  min-height: 100vh;
  background-color: #f5f5f7;
  color: #1d1d1f;
  padding: 3rem 1.5rem 5rem;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
    "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.sub-page__container {
  max-width: 680px;
  margin: 0 auto;
}

.sub-page__header {
  margin-bottom: 2.5rem;
}

.sub-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(33, 166, 141, 0.12);
  color: #1b8a73;
  font-weight: 600;
  font-size: 0.82rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.8rem;
}

.sub-title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: #111827;
  margin-bottom: 0.75rem;
}

.sub-subtitle {
  font-size: 1.05rem;
  color: #6b7280;
  line-height: 1.5;
  max-width: 540px;
  margin: 0 auto;
}

.apple-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 1.75rem;
}

.highlight-card {
  border: 2px solid #21a68d;
  position: relative;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 1.5rem;
}

.plan-tier {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #21a68d;
  letter-spacing: 0.05em;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.plan-price .currency {
  font-size: 1.25rem;
  font-weight: 600;
  vertical-align: top;
  color: #111827;
}

.plan-price .amount {
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
}

.plan-price .interval {
  font-size: 0.95rem;
  color: #6b7280;
  margin-left: 4px;
}

.activating-banner {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.95rem;
  text-align: center;
}

.plan-price .follow-on {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 2px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(33, 166, 141, 0.15);
  color: #21a68d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-item strong {
  display: block;
  font-size: 0.98rem;
  color: #1f2937;
  margin-bottom: 2px;
}

.feature-item p {
  font-size: 0.88rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.75rem;
  border-radius: 14px;
  background: #21a68d;
  color: #ffffff !important;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(33, 166, 141, 0.35);
}

.primary-btn:hover {
  background: #1b8a73;
  transform: translateY(-1px);
}

.checkout-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.05rem;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.4rem;
  border-radius: 12px;
  background: #f3f4f6;
  color: #1f2937 !important;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

.text-btn {
  background: none;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.text-danger {
  color: #ef4444;
}

.text-danger:hover {
  text-decoration: underline;
}

.secure-tag {
  font-size: 0.8rem;
  color: #9ca3af;
}

.card-heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.card-subtext {
  font-size: 0.92rem;
  color: #6b7280;
  line-height: 1.45;
}

.active-card__hero {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.active-badge-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(33, 166, 141, 0.15);
  color: #21a68d;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  background: #f9fafb;
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.meta-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.restore-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.apple-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
  background: #ffffff;
  color: #111827;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.apple-input:focus {
  border-color: #21a68d;
  box-shadow: 0 0 0 3px rgba(33, 166, 141, 0.15);
}

.error-banner {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 0.88rem;
  margin: 0;
}

.success-banner {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #059669;
  font-size: 0.88rem;
  margin: 0;
}

.w-full {
  width: 100%;
}
</style>
