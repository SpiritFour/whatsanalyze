/**
 * Whether Wrapped is gated by the subscription: free visitors get one
 * analysis per day, the next upload opens the paywall
 * (components/wrapped/SubscriptionPaywall.vue), and /wrapped shows the
 * Free vs Pro pricing card (components/wrapped/SubscriptionAd.vue), whose
 * whole pitch is that daily limit.
 *
 * Off for the December 2026 season. In the 90 days before, 130 people met the
 * paywall, 6 started checkout and about none bought, and every one of them
 * was stopped before seeing a story. Everyone now gets the full story free.
 * Set to true to bring the gate and the pricing card back.
 */
export const WRAPPED_PAYWALL_ENABLED = false;
