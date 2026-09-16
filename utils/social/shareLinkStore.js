import { retrieveResult, storeResult } from "~/utils/wrapped/sharing/firestore";
import {
  buildSharePayload,
  parseShareInfo,
  parseSharePayload,
  serializeShareInfo,
} from "~/utils/social/shareLink";

/**
 * The Firestore half of a share link, kept apart from the pure payload and URL
 * handling in shareLink.js so that logic stays unit-testable without a browser.
 *
 * The collection and the encryption are wrapped's, unchanged: the document
 * holds ciphertext only, and the key exists nowhere but the link's fragment.
 */
export async function storeSharedCards(cards, locale) {
  return serializeShareInfo(
    await storeResult(buildSharePayload(cards, locale)),
  );
}

export async function loadSharedCards(fragment) {
  return parseSharePayload(await retrieveResult(parseShareInfo(fragment)));
}
