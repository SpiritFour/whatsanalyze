/**
 * Unified Analytics Engine for WhatsAnalyze
 *
 * Dispatches window.gtag('event', name, params) -> Google Analytics 4
 * (Property 262743198 / G-XYC2EWGZZ3). GTM/Bing Ads is not used.
 */

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
      value:
        options.value ??
        (options.checkoutType === "subscription" ? 4.99 : 2.99),
      currency: options.currency || "USD",
      source: options.source || "unknown",
    });
  },

  purchase(options: {
    transactionId: string;
    value: number;
    currency?: string;
    paymentType: "subscription" | "one_time";
    subscriptionId?: string;
    source?: string;
  }) {
    trackEvent("purchase", {
      transaction_id: options.transactionId,
      value: options.value,
      currency: options.currency || "USD",
      payment_type: options.paymentType,
      subscription_id: options.subscriptionId,
      source: options.source,
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
};

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
  };
}
