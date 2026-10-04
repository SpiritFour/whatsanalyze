import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  ChatTooLargeError,
  SHARE_SIZE_LIMIT,
  base64ToBytes,
  buildSharePayload,
  bytesToBase64,
  bytesToBase64Url,
  decodeShareToken,
  encodeShareToken,
  parseSharePayload,
} from "~/utils/social/shareLink";

/**
 * The Firestore half of a share link.
 *
 * Same collection and same shape as Wrapped's share links -- a document under
 * `data/{id}` holding one base64 string -- but the encryption runs over bytes
 * rather than text. Wrapped serialises a small object and can afford to encrypt
 * a string; a snapshot is compressed first, and base64-ing those bytes only to
 * encrypt and base64 them again would add a third for nothing.
 */
async function encryptBytes(bytes) {
  const cryptoKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    bytes,
  );

  return {
    data: bytesToBase64(new Uint8Array(ciphertext)),
    // The key never reaches Firestore: it travels in the share link's
    // fragment, so only someone holding the whole link can read the chat back.
    encryptedKey: {
      iv: Array.from(iv),
      key: await crypto.subtle.exportKey("raw", cryptoKey),
    },
  };
}

async function decryptBytes(data, { iv, key }) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", true, [
    "decrypt",
  ]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    cryptoKey,
    base64ToBytes(data),
  );
  return new Uint8Array(plaintext);
}

/**
 * The document id is 16 random bytes, written as base64url both in the link
 * and as the Firestore path, so the id travels as 16 bytes of the token rather
 * than as a 36 character uuid string.
 */
const documentIdFor = (id) => bytesToBase64Url(id);

export async function storeSharedAnalysis(snapshot) {
  const { data, encryptedKey } = await encryptBytes(
    buildSharePayload(snapshot),
  );
  // Checked before the write so an analysis that cannot fit is reported as
  // such, rather than coming back as a Firestore error about document size.
  if (data.length > SHARE_SIZE_LIMIT) throw new ChatTooLargeError(data.length);

  const id = crypto.getRandomValues(new Uint8Array(16));
  await setDoc(doc(useNuxtApp().$firestore, "data", documentIdFor(id)), {
    data,
  });

  return encodeShareToken({ id, ...encryptedKey });
}

export async function loadSharedAnalysis(fragment) {
  const { id, iv, key } = decodeShareToken(fragment);
  const stored = await getDoc(
    doc(useNuxtApp().$firestore, "data", documentIdFor(id)),
  );
  if (!stored.exists()) throw new Error("No such share link");

  return parseSharePayload(await decryptBytes(stored.data().data, { iv, key }));
}
