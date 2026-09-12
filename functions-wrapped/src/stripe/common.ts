import { defineSecret, defineString } from "firebase-functions/params";
import Stripe from "stripe";
import { HttpsError } from "firebase-functions/https";

export const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
export const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
export const stripePublishableKey = defineString("STRIPE_PUBLISHABLE_KEY");
export const proPriceId = defineString("PRO_PRICE_ID");
export const appName = defineString("APP_NAME");
const allowedOrigins = defineString("ALLOWED_ORIGINS");

export const getStripe = () =>
  new Stripe(stripeSecretKey.value(), {
    apiVersion: "2026-02-25.clover",
    appInfo: {
      name: appName.value(),
      version: "0.0.1",
    },
  });

export function validateOrigin(origin?: string): string {
  if (!origin) {
    throw new HttpsError("failed-precondition", "Origin missing.");
  }

  const allowed = allowedOrigins
    .value()
    .split(",")
    .map((o) => o.trim());

  // Check exact match first
  if (allowed.includes(origin)) {
    return origin;
  }

  // Check wildcard patterns (e.g., https://example--pr-*.web.app)
  for (const pattern of allowed) {
    if (pattern.includes("*")) {
      // Escape special regex chars except *, then replace * with .*
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(origin)) {
        return origin;
      }
    }
  }

  throw new HttpsError("failed-precondition", `Origin not allowed: ${origin}`);
}

/**
 * Client-supplied redirect URLs (Stripe success/cancel/return URLs) must stay
 * on the already-validated origin, otherwise a caller could turn this
 * endpoint into an open redirect for phishing.
 */
export function ensureSameOrigin(
  url: string | undefined,
  origin: string,
  field: string
): string | undefined {
  if (!url) return undefined;
  if (url !== origin && !url.startsWith(`${origin}/`)) {
    throw new HttpsError("invalid-argument", `${field} must match the request origin.`);
  }
  return url;
}
