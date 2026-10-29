<template>
  <div v-if="paymentError || showReuploadHint" class="purchase-notice">
    <v-alert v-if="paymentError" density="compact" type="warning">
      We could not confirm your payment. If you were charged, please contact us
      and we will sort it out.
    </v-alert>
    <v-alert v-else density="compact" type="success">
      Your full chat PDF is paid for. Upload the chat again to download it — it
      never left your device, so we cannot restore it for you.
    </v-alert>
  </div>
</template>

<script>
import { toRaw } from "vue";
import { httpsCallable } from "firebase/functions";
import { analyticsEcommerce } from "~/composables/useAnalytics";
import { chatFingerprint } from "~/utils/chatFingerprint";

/**
 * Stripe sends a one-time buyer back to the page they paid on. This confirms
 * the session really was paid and unlocks the full PDF; PdfDownloadPopup then
 * downloads it on its own once the chat it was bought for is on screen.
 */
export default {
  name: "OneTimePurchaseReturn",
  props: {
    // the chat on screen, if any
    chat: { type: Object, default: null },
    // analytics label of the page the purchase was made on
    checkoutSource: { type: String, required: true },
  },
  setup() {
    return { oneTimePurchase: useOneTimePurchase() };
  },
  data() {
    return { paymentError: false };
  },
  computed: {
    showReuploadHint() {
      // Paid for the full PDF, but the chat it was bought for is not the one
      // on screen: it is gone (tab closed, too large to keep in
      // sessionStorage) or a different chat was uploaded since.
      return (
        Boolean(this.oneTimePurchase) &&
        !unlocksChat(this.oneTimePurchase, chatFingerprint(toRaw(this.chat)))
      );
    },
  },
  mounted() {
    this.oneTimePurchase = restoreOneTimePurchase();
    this.confirmOneTimePayment();
  },
  methods: {
    async confirmOneTimePayment() {
      const { payment_success: paymentSuccess, session_id: sessionId } =
        this.$route.query;

      if (paymentSuccess !== "true" || !sessionId) return;

      // Never leave the ids in the URL: a reload or a shared link would
      // re-run this, and the session id is the proof of payment.
      const query = { ...this.$route.query };
      delete query.payment_success;
      delete query.session_id;
      this.$router.replace({ query });

      try {
        const getCheckoutSession = httpsCallable(
          this.$functions,
          "getCheckoutSession",
        );
        const res = await getCheckoutSession({ sessionId });
        const session = res.data;

        if (session?.payment_status !== "paid") {
          console.warn(
            "Checkout session is not paid:",
            session?.payment_status,
          );
          return;
        }

        analyticsEcommerce.checkoutCompleted("one_time", this.checkoutSource);
        // The `purchase` event itself comes from the Stripe webhook, which sees
        // the sales this page never does: ad blockers, and buyers who close the
        // tab before it loads.
        this.oneTimePurchase = persistOneTimePurchase(sessionId);
      } catch (err) {
        console.error("Could not confirm the one-time payment:", err);
        this.paymentError = true;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.purchase-notice {
  padding: 1rem 1.5rem 0;
  max-width: $wa-shell-width;
  margin: 0 auto;
}
</style>
