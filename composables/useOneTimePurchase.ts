const STORAGE_KEY = "whatsanalyze_one_time_purchase";

export interface OneTimePurchase {
  /** Stripe Checkout Session the payment was confirmed against. */
  sessionId: string;
  /**
   * Fingerprint of the chat this payment unlocks. A single payment buys the
   * PDF of the chat it was started from, so the next upload has to pay again.
   * Null is an entry from before purchases named a chat, and unlocks nothing.
   */
  chatFingerprint: string | null;
  /**
   * True while the PDF the user just paid for still has to start downloading.
   * Set when returning from Checkout, cleared once the download has fired, so
   * a later navigation does not download the file all over again.
   */
  pendingDownload: boolean;
}

interface StoredPurchase {
  sessionId?: string;
  chatFingerprint?: string | null;
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

const readStoredPurchase = (): StoredPurchase | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPurchase) : null;
  } catch (err) {
    console.warn("Failed to read one-time purchase:", err);
    return null;
  }
};

const writeStoredPurchase = (stored: StoredPurchase) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.warn("Failed to persist one-time purchase:", err);
  }
};

/**
 * Note which chat is being paid for before handing the user to Stripe. The
 * redirect is a full page load, so the answer has to be written down now —
 * coming back we only get a session id, which says nothing about the chat.
 */
export const rememberOneTimeCheckoutChat = (chatFingerprint: string | null) => {
  writeStoredPurchase({ chatFingerprint });
};

export const restoreOneTimePurchase = (): OneTimePurchase | null => {
  const stored = readStoredPurchase();
  // Without a session id this is only the note we left before the redirect:
  // the checkout was started but never paid.
  if (!stored?.sessionId) return null;
  return {
    sessionId: stored.sessionId,
    chatFingerprint: stored.chatFingerprint ?? null,
    pendingDownload: false,
  };
};

export const persistOneTimePurchase = (sessionId: string): OneTimePurchase => {
  const chatFingerprint = readStoredPurchase()?.chatFingerprint ?? null;
  writeStoredPurchase({ sessionId, chatFingerprint });
  return { sessionId, chatFingerprint, pendingDownload: true };
};

/** Does this purchase unlock the chat currently on screen? */
export const unlocksChat = (
  purchase: OneTimePurchase | null,
  fingerprint: string | null
): boolean => {
  // A purchase that names no chat unlocks no chat. Anything else would hand
  // the full PDF to whatever is open, which is the hole this exists to close.
  if (!purchase?.chatFingerprint || !fingerprint) return false;
  return purchase.chatFingerprint === fingerprint;
};
