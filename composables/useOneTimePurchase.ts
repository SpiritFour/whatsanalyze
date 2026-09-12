const STORAGE_KEY = "whatsanalyze_one_time_purchase";

export interface OneTimePurchase {
  /** Stripe Checkout Session the payment was confirmed against. */
  sessionId: string;
  /**
   * True while the PDF the user just paid for still has to start downloading.
   * Set when returning from Checkout, cleared once the download has fired, so
   * a later navigation does not download the file all over again.
   */
  pendingDownload: boolean;
}

/**
 * Access to the full PDF bought with a single payment. It is kept for the
 * browser session (not forever) because it unlocks the chat the user is
 * currently analyzing, and it survives the Checkout redirect, which is a full
 * page load. Like the subscription flag this only gates a PDF the browser
 * builds itself — the meaningful check is the paid Checkout Session confirmed
 * by Stripe before the flag is ever set.
 */
export const useOneTimePurchase = () =>
  useState<OneTimePurchase | null>("one_time_purchase", () => null);

export const restoreOneTimePurchase = (): OneTimePurchase | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { sessionId?: string };
    if (!stored?.sessionId) return null;
    return { sessionId: stored.sessionId, pendingDownload: false };
  } catch (err) {
    console.warn("Failed to read one-time purchase:", err);
    return null;
  }
};

export const persistOneTimePurchase = (sessionId: string) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId }));
  } catch (err) {
    console.warn("Failed to persist one-time purchase:", err);
  }
};
