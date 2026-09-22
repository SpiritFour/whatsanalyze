<template>
  <div class="sub-page">
    <div class="sub-page__container">
      <!-- Top header branding -->
      <div class="sub-page__header text-center">
        <span class="sub-badge">WhatsAnalyze Pro</span>
        <h1 class="sub-title">{{ $t("subscribePage.title") }}</h1>
        <p class="sub-subtitle">{{ $t("subscribePage.subtitle") }}</p>
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
            <h2 class="card-heading">
              {{ $t("subscribePage.activeTitle") }}
            </h2>
            <p class="card-subtext">
              {{ $t("subscribePage.activeSubtext") }}
            </p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">{{
              $t("subscribePage.subscriptionIdLabel")
            }}</span>
            <span class="meta-value mono">{{
              subscriptionStore.getSubscriptionId
            }}</span>
          </div>
          <div v-if="subscriptionStore.getEmail" class="meta-item">
            <span class="meta-label">{{ $t("subscribePage.emailLabel") }}</span>
            <span class="meta-value">{{ subscriptionStore.getEmail }}</span>
          </div>
          <div v-if="subscriptionStore.getExpiresAt" class="meta-item">
            <span class="meta-label">{{
              $t("subscribePage.validUntilLabel")
            }}</span>
            <span class="meta-value">{{
              formatDate(subscriptionStore.getExpiresAt)
            }}</span>
          </div>
        </div>

        <p v-if="portalError" class="error-banner">{{ portalError }}</p>

        <div class="actions-row">
          <NuxtLink
            :to="localePath({ path: '/', hash: '#payButton' })"
            class="primary-btn"
          >
            {{ $t("subscribePage.openAnalyzer") }}
          </NuxtLink>
          <NuxtLink :to="localePath('/wrapped')" class="secondary-btn">
            {{ $t("subscribePage.openWrapped") }}
          </NuxtLink>
          <button
            class="secondary-btn"
            :disabled="isPortalLoading"
            @click="openCustomerPortal"
          >
            {{
              isPortalLoading
                ? $t("subscribePage.openingPortal")
                : $t("subscribePage.managePortal")
            }}
          </button>
          <button class="text-btn text-danger" @click="logout">
            {{ $t("subscribePage.logout") }}
          </button>
        </div>
      </div>

      <!-- State: No Active Subscription -->
      <div v-else class="space-y-8">
        <p v-if="subscriptionStore.isActivating" class="activating-banner">
          {{ $t("subscribePage.activating") }}
        </p>

        <!--
          Why the link they clicked did not let them in. It belongs above the
          sales pitch: at the bottom of the page, next to the restore form,
          it sat below the fold and the page looked like ordinary pricing.
        -->
        <div v-if="linkError" class="error-banner link-error">
          <strong>{{ linkError }}</strong>
          <span>{{ $t("subscribePage.linkErrorHint") }}</span>
        </div>

        <!-- Pricing / Plan Tier Card -->
        <div class="apple-card highlight-card">
          <div class="plan-header">
            <div>
              <span class="plan-tier">{{ $t("subscribePage.planTier") }}</span>
              <h2 class="plan-name">WhatsAnalyze All-Access</h2>
            </div>
            <div class="plan-price">
              <span class="amount">{{ introPrice }}</span>
              <span class="interval">{{ $t("subscribePage.firstMonth") }}</span>
              <div class="follow-on">
                {{ $t("subscribePage.followOn", { price: subscriptionPrice }) }}
              </div>
            </div>
          </div>

          <div class="feature-list">
            <div v-for="n in 4" :key="n" class="feature-item">
              <div class="check-icon">✓</div>
              <div>
                <strong>{{ $t(`subscribePage.feature${n}Title`) }}</strong>
                <p>{{ $t(`subscribePage.feature${n}Text`) }}</p>
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
                  ? $t("subscribePage.redirecting")
                  : $t("chooseSubscription")
              }}
            </button>
            <p class="secure-tag mt-2">{{ $t("subscribePage.secureTag") }}</p>
          </div>
        </div>

        <!-- Restore / Login Card -->
        <div class="apple-card">
          <h3 class="card-heading">{{ $t("subscribePage.restoreTitle") }}</h3>
          <p class="card-subtext mb-4">{{ $t("subscribePage.restoreText") }}</p>

          <form class="restore-form" @submit.prevent="verify()">
            <div class="input-group">
              <label for="sub-email">{{
                $t("subscribePage.emailFieldLabel")
              }}</label>
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
              <label for="sub-id">{{
                $t("subscribePage.subscriptionIdLabel")
              }}</label>
              <input
                id="sub-id"
                v-model="subscriptionId"
                type="text"
                placeholder="sub_... or I-..."
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
              {{
                loading
                  ? $t("subscribePage.verifying")
                  : $t("subscribePage.verifyCta")
              }}
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
import { INTRO_PRICE, SUBSCRIPTION_PRICE, formatPrice } from "~/utils/pricing";
import { analyticsEcommerce } from "~/composables/useAnalytics";
export default {
  name: "Subscriptions",
  setup() {
    // The page is reachable under every locale prefix, so every link out of it
    // — and the reload after logging out — has to keep the reader's language.
    return { localePath: useLocalePath() };
  },
  data() {
    return {
      email: "",
      subscriptionId: "",
      loading: false,
      isCheckoutLoading: false,
      error: "",
      /** Why a link from an email or a checkout return did not let them in. */
      linkError: "",
      successMessage: "",
      isPortalLoading: false,
      portalError: "",
    };
  },
  computed: {
    subscriptionStore() {
      return useSubscriptionStore();
    },
    introPrice() {
      return formatPrice(INTRO_PRICE, this.$i18n.locale);
    },
    subscriptionPrice() {
      return formatPrice(SUBSCRIPTION_PRICE, this.$i18n.locale);
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

    if (this.$route.query.canceled) {
      analyticsEcommerce.checkoutCancelled("subscribe_page");
    } else {
      analyticsEcommerce.viewPricing("subscribe_page");
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString(this.$i18n.locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    async startSubscriptionCheckout() {
      if (this.isCheckoutLoading) return;
      this.isCheckoutLoading = true;
      analyticsEcommerce.beginCheckout({
        checkoutType: "subscription",
        source: "subscribe_page",
        value: 4.99,
        currency: "USD",
      });
      try {
        const returnPath = `${window.location.origin}${this.localePath(
          "/subscribe"
        )}`;
        const url = await fetchSubscriptionCheckoutUrl({
          successUrl: `${returnPath}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${returnPath}?canceled=true`,
        });
        if (!url) throw new Error("No checkout URL returned");
        window.location.assign(url);
      } catch (err) {
        console.error("Error starting checkout:", err);
        alert(this.$t("subscribePage.errorCheckout"));
        this.isCheckoutLoading = false;
      }
    },
    /**
     * The session id is the proof of payment for a checkout that just
     * happened. Leaving it in the URL means a reload or a shared link replays
     * it, so it goes as soon as it has been read.
     */
    dropSessionIdFromUrl() {
      if (!this.$route.query.session_id) return;
      const query = { ...this.$route.query };
      delete query.session_id;
      this.$router.replace({ query });
    },
    async autoVerifyFromParams() {
      // If we only have session_id from checkout return, resolve details first
      const sessionId = this.$route.query.session_id;
      this.dropSessionIdFromUrl();
      if (sessionId && !this.email) {
        try {
          this.loading = true;
          const functions = this.$functions;
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
          // No `purchase` event here: the Stripe webhook reports it off the
          // paid invoice, which is also the only place a renewal shows up.
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
        await this.verify({
          afterCheckout: Boolean(sessionId),
          fromLink: true,
        });
      }
    },
    async verify({ afterCheckout = false, fromLink = false } = {}) {
      if (!this.email || !this.subscriptionId) {
        this.error = this.$t("subscribePage.errorMissingFields");
        return;
      }

      this.error = "";
      this.linkError = "";
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
          this.successMessage = this.$t("subscribePage.verifySuccess");
          analyticsEcommerce.subscriptionVerified(
            afterCheckout
              ? "auto_param"
              : fromLink
              ? "email_link"
              : "manual_code"
          );
        } else {
          this.reportFailure(
            result.message || this.$t("subscribePage.errorVerifyFailed"),
            fromLink
          );
        }
      } catch (err) {
        this.reportFailure(
          err?.message || this.$t("subscribePage.errorUnexpected"),
          fromLink
        );
      } finally {
        this.loading = false;
      }
    },
    /**
     * A failure the customer asked for goes next to the form they submitted;
     * one from a link they clicked goes to the top of the page, where they are
     * looking, instead of below the pricing they never asked to see.
     */
    reportFailure(message, fromLink) {
      if (fromLink) this.linkError = message;
      else this.error = message;
    },
    async openCustomerPortal() {
      const activeEmail = this.email || this.subscriptionStore.getEmail;
      const activeSubscriptionId =
        this.subscriptionId || this.subscriptionStore.getSubscriptionId;

      if (!activeEmail || !activeSubscriptionId) {
        this.portalError = this.$t("subscribePage.errorPortalMissing");
        return;
      }

      this.portalError = "";
      this.isPortalLoading = true;

      try {
        const functions = this.$functions;
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

        analyticsEcommerce.customerPortalOpened(activeSubscriptionId);
        window.location.href = data.url;
      } catch (err) {
        this.portalError =
          err?.message || this.$t("subscribePage.errorPortalFailed");
      } finally {
        this.isPortalLoading = false;
      }
    },
    logout() {
      if (!confirm(this.$t("subscribePage.logoutConfirm"))) return;
      this.subscriptionStore.logout();
      this.email = "";
      this.subscriptionId = "";
      this.error = "";
      this.linkError = "";
      this.successMessage = "";
      window.location.replace(this.localePath("/subscribe"));
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
  /* Wide enough for a Stripe subscription id to stay on one line; squeezing a
     third column in here is what made it wrap into its neighbour. */
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  background: #f9fafb;
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  /* Grid items default to min-width: auto, which lets a long id push past its
     column and paint over the neighbouring one. */
  min-width: 0;
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
  overflow-wrap: anywhere;
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

.link-error {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.95rem;
  text-align: center;
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
