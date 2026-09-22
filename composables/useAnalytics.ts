/**
 * Every analytics event the site sends.
 *
 * Dispatches window.gtag('event', name, params) -> Google Analytics 4
 * (Property 262743198 / G-XYC2EWGZZ3). GTM/Bing Ads is not used.
 *
 * Events go through the typed helpers below rather than `trackEvent` directly,
 * so the set of event names is the set of methods here. There used to be a
 * second, untyped `gtagEvent` path alongside this one, carrying Universal
 * Analytics' event_category/event_label vocabulary that GA4 has no use for —
 * ten components fired both and every action was counted twice.
 */
import { CURRENCY, INTRO_PRICE, ONE_TIME_PRICE } from "~/utils/pricing";

/* eslint-disable no-unused-vars -- ambient type declaration, not a real binding */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
/* eslint-enable no-unused-vars */

export interface EventParams {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Ensures gtag function exists on window, matching the official gtag.js bootstrap.
 * This guarantees events called before or after gtag.js loads are queued and processed.
 */
function ensureGtag(): boolean {
  if (typeof window === "undefined") return false;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
  return true;
}

/**
 * Sanitizes event names to adhere to GA4 rules:
 * - 1 to 40 characters
 * - Only alphanumeric and underscores
 * - Must start with a letter
 * - Lowercase snake_case
 */
export function sanitizeEventName(rawName: string): string {
  if (!rawName) return "custom_event";

  // Replace spaces, dashes, dots with underscores
  let name = rawName
    .trim()
    .replace(/[\s\-.]+/g, "_")
    // Remove any character that is not alphanumeric or underscore
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

  // Ensure it starts with a letter (prefix with 'ev_' if it starts with digit or underscore)
  if (!/^[a-z]/.test(name)) {
    name = `ev_${name}`;
  }

  // Cap at 40 characters
  return name.slice(0, 40);
}

/**
 * Sanitizes event parameters:
 * - Parameter names must be valid snake_case identifiers
 * - Strings trimmed and capped at 100 characters
 * - Numbers kept as numbers (not stringified)
 * - Undefined/null/NaN cleaned up
 */
export function sanitizeParams(
  rawParams?: EventParams
): Record<string, string | number | boolean> {
  if (!rawParams) return {};

  const clean: Record<string, string | number | boolean> = {};

  for (const [key, val] of Object.entries(rawParams)) {
    if (val === undefined || val === null) continue;

    // Clean key
    const cleanKey = key
      .trim()
      .replace(/[\s\-.]+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase()
      .slice(0, 40);

    if (!cleanKey) continue;

    if (typeof val === "number") {
      if (Number.isFinite(val)) {
        clean[cleanKey] = Math.round(val * 100) / 100;
      }
    } else if (typeof val === "boolean") {
      clean[cleanKey] = val;
    } else {
      const strVal = String(val).trim().slice(0, 100);
      clean[cleanKey] = strVal;
    }
  }

  return clean;
}

/**
 * Core event tracking function.
 */
export function trackEvent(name: string, params?: EventParams): void {
  if (!ensureGtag()) return;

  const eventName = sanitizeEventName(name);
  const cleanParams = sanitizeParams(params);

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, cleanParams);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Analytics] Failed to track event:", eventName, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Typed Domain-Specific Tracking Helpers
// ---------------------------------------------------------------------------

/**
 * E-Commerce & Subscriptions
 */
export const analyticsEcommerce = {
  viewPricing(source: string, planType: string = "pro_monthly") {
    trackEvent("view_pricing", {
      source,
      plan_type: planType,
    });
  },

  /**
   * The amounts come from utils/pricing.ts, which is what the pages quote and
   * what the Stripe prices are configured with. Spelling them out here is how
   * begin_checkout came to report $4.99 for a €7.99 sale, so the funnel
   * disagreed with the purchase events the webhook sends.
   */
  beginCheckout(options: {
    checkoutType: "subscription" | "one_time";
    priceId?: string;
    value?: number;
    currency?: string;
    source?: string;
  }) {
    trackEvent("begin_checkout", {
      checkout_type: options.checkoutType,
      price_id: options.priceId || "default",
      // A subscription is charged the discounted first month at checkout.
      value:
        options.value ??
        (options.checkoutType === "subscription"
          ? INTRO_PRICE
          : ONE_TIME_PRICE),
      currency: options.currency || CURRENCY,
      source: options.source || "unknown",
    });
  },

  // No `purchase` here on purpose. It is sent from the Stripe webhook
  // (`functions/src/analytics/measurementProtocol.ts`), which sees every
  // paid cent plus the renewals no browser is around for. GA4 does not
  // deduplicate by transaction id, so exactly one sender may exist.

  /**
   * Back from Stripe with a paid session. Deliberately not `purchase` —
   * that one is the webhook's, and GA4 does not deduplicate.
   */
  checkoutCompleted(checkoutType: "subscription" | "one_time", source: string) {
    trackEvent("checkout_completed", {
      checkout_type: checkoutType,
      source,
    });
  },

  checkoutCancelled(source: string) {
    trackEvent("checkout_cancelled", { source });
  },

  customerPortalOpened(subscriptionId?: string) {
    trackEvent("customer_portal_opened", {
      subscription_id: subscriptionId || "unknown",
    });
  },

  subscriptionVerified(method: "auto_param" | "manual_code" | "email_link") {
    trackEvent("subscription_verified", { method });
  },
};

/**
 * Standalone Tools (/tools/* and ToolDropzone)
 */
export const analyticsTools = {
  hubClick(toolName: string) {
    trackEvent("tool_hub_click", { tool_name: toolName });
  },

  fileUploaded(
    toolName: string,
    fileType: "txt" | "zip" | "other",
    source: "drop" | "picker" = "picker"
  ) {
    trackEvent("tool_file_uploaded", {
      tool_name: toolName,
      file_type: fileType,
      upload_source: source,
    });
  },

  sampleLoaded(toolName: string) {
    trackEvent("tool_sample_loaded", { tool_name: toolName });
  },

  analyzed(toolName: string, messageCount: number, durationMs?: number) {
    trackEvent("tool_analyzed", {
      tool_name: toolName,
      message_count: messageCount,
      duration_ms: durationMs ? Math.round(durationMs) : undefined,
    });
  },

  error(toolName: string, errorCode: string) {
    trackEvent("tool_error", {
      tool_name: toolName,
      error_code: errorCode,
    });
  },

  ctaClick(
    toolName: string,
    ctaType: "full_analyzer" | "export_guide" | "subscribe" | "other"
  ) {
    trackEvent("tool_cta_click", {
      tool_name: toolName,
      cta_type: ctaType,
    });
  },
};

/**
 * Core Chat Analyzer (Main flow)
 */
export const analyticsChat = {
  uploadStarted(
    fileType: "txt" | "zip" | "other",
    uploadMethod: "drop" | "picker" | "shared" = "picker"
  ) {
    trackEvent("file_upload_started", {
      file_type: fileType,
      upload_method: uploadMethod,
    });
  },

  parsedSuccess(
    messageCount: number,
    participantCount?: number,
    durationMs?: number
  ) {
    trackEvent("file_parsed_success", {
      message_count: messageCount,
      participant_count: participantCount,
      duration_ms: durationMs ? Math.round(durationMs) : undefined,
    });
  },

  parsedError(errorCode: string) {
    trackEvent("file_parsed_error", {
      error_code: sanitizeEventName(errorCode),
    });
  },

  chatAnalyzed(participantCount: number, isGroup: boolean) {
    trackEvent("chat_analyzed", {
      chat_type: isGroup ? "group" : "pair",
      participant_count: participantCount,
    });
  },

  participantChanged() {
    trackEvent("select_participant", { action: "change_ego" });
  },

  share(
    method: "native_share" | "clipboard" | "image_download",
    contentType: string
  ) {
    trackEvent("share", {
      method,
      content_type: contentType,
    });
  },

  download(
    fileType: "pdf_sample" | "pdf_full" | "chart_image",
    chartName?: string
  ) {
    trackEvent("file_download", {
      file_type: fileType,
      chart_name: chartName,
    });
  },
};

/**
 * Wrapped Story Flow
 */
export const analyticsWrapped = {
  slideView(slideName: string, slideIndex: number) {
    trackEvent("story_slide_view", {
      slide_name: slideName,
      slide_index: slideIndex,
    });
  },

  paywallViewed(source: "upload_gate" | "card_click" | "other") {
    trackEvent("paywall_viewed", { source });
  },

  storyShared(method: "native" | "copy") {
    trackEvent("story_shared", { method });
  },

  resultsViewed(isShared: boolean) {
    trackEvent("wrapped_results_viewed", {
      source: isShared ? "shared_link" : "own_upload",
    });
  },
};

/**
 * Site-wide interactions that belong to no single product.
 */
export const analyticsSite = {
  /** A CTA that scrolls the visitor to an upload box rather than navigating. */
  jumpToUpload(source: string) {
    trackEvent("jump_to_upload", { source });
  },

  pwaInstall(outcome: "accepted" | "dismissed") {
    trackEvent("pwa_install", { outcome });
  },

  languageChanged(from: string, to: string) {
    trackEvent("language_changed", { from, to });
  },

  /** The PayPal donate button on the results page. */
  donateClicked(source: string) {
    trackEvent("donate_clicked", { source });
  },
};

/**
 * The GA identifiers of this browser, read straight off the cookies gtag
 * writes. Purchases are reported from the Stripe webhook, which sees the money
 * but not the visitor — these are what let it file the sale under the campaign
 * that brought the buyer in, instead of as a new direct user.
 *
 * Both are empty when GA never loaded: an ad blocker, or a visitor who
 * declined the analytics cookies. The webhook still books the revenue, and it
 * stays unattributed — which is what declining is supposed to mean.
 */
export function getAnalyticsIds(): { clientId?: string; sessionId?: string } {
  const cookies = new Map<string, string>();
  if (typeof document !== "undefined") {
    for (const entry of document.cookie.split(";")) {
      const separator = entry.indexOf("=");
      if (separator === -1) continue;
      cookies.set(entry.slice(0, separator).trim(), entry.slice(separator + 1));
    }
  }

  // "GA1.1.1234567890.1700000000" — the client id is the last two parts.
  const ga = cookies.get("_ga");
  const clientId = ga ? ga.split(".").slice(-2).join(".") : undefined;

  // "GS2.1.s1700000000$o3$g1$..." on the per-property cookie. There is only
  // one GA4 container on this site, so the suffix does not have to be known.
  const session = [...cookies.entries()].find(([key]) =>
    key.startsWith("_ga_")
  )?.[1];
  const sessionId = session
    ? session.split(".")[2]?.replace(/^s/, "").split("$")[0]
    : undefined;

  // Only what was actually found: the callable SDK turns an undefined property
  // into a null on the wire, and a null id has no business reaching Stripe.
  return {
    ...(clientId ? { clientId } : {}),
    ...(sessionId ? { sessionId } : {}),
  };
}

/**
 * Nuxt Composable
 */
export function useAnalytics() {
  return {
    trackEvent,
    ecommerce: analyticsEcommerce,
    tools: analyticsTools,
    chat: analyticsChat,
    wrapped: analyticsWrapped,
    site: analyticsSite,
  };
}
