/**
 * Every price the site quotes, in one place. The pricing table, the subscribe
 * page and the Wrapped upsell each used to spell their prices out by hand,
 * which is how "€4,99 first month" ended up next to a €5,00 charge and how one
 * table came to show "7,99 Euro", "7.99 EUR" and "€10/month" side by side.
 */
export const CURRENCY = "EUR";

/** The full chat PDF, bought once. */
export const ONE_TIME_PRICE = 7.99;

/** What the one-time PDF is discounted from. */
export const ONE_TIME_LIST_PRICE = 15;

/**
 * The first month of Pro. Stripe applies a flat 5 € off coupon
 * (INTRO_COUPON_ID) to the monthly price, so this is exactly what is charged —
 * quoting anything else here is a price indication the checkout contradicts.
 */
export const INTRO_PRICE = 5;

/** Pro, per month after the first one. */
export const SUBSCRIPTION_PRICE = 10;

/** Rounded from the real prices, so the badge cannot drift from them. */
export const ONE_TIME_DISCOUNT_PERCENT = Math.round(
  (1 - ONE_TIME_PRICE / ONE_TIME_LIST_PRICE) * 100
);

/**
 * One currency format for the whole site: the locale decides whether the
 * symbol leads or trails and whether cents are separated by a comma or a dot.
 */
export const formatPrice = (amount: number, locale = "en"): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY,
    // Round amounts read as "€10", not "€10.00"; 7.99 keeps its cents.
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
