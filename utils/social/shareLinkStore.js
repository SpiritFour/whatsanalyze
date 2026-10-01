import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import {
  ChatTooLargeError,
  SHARE_SIZE_LIMIT,
  base64ToBytes,
  buildSharePayload,
  bytesToBase64,
  parseShareInfo,
  parseSharePayload,
  serializeShareInfo,
} from "~/utils/social/shareLink";

/**
 * The Firestore half of a share link.
 *
 * Same collection and same shape as Wrapped's share links -- a document under
 * `data/{uuid}` holding one base64 string -- but the encryption runs over bytes
 * rather than text. Wrapped serialises a small object and can afford to encrypt
 * a string; a whole chat has to be compressed first, and base64-ing those bytes
 * only to encrypt and base64 them again would add a third to a payload that is
 * already up against the document limit.
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

export async function storeSharedChat(messages) {
  const { data, encryptedKey } = await encryptBytes(
    buildSharePayload(messages),
  );
  // Checked before the write so a chat that cannot fit is reported as such,
  // rather than coming back as a Firestore error about document size.
  if (data.length > SHARE_SIZE_LIMIT) throw new ChatTooLargeError(data.length);

  const uuid = uuidv4();
  await setDoc(doc(useNuxtApp().$firestore, "data", uuid), { data });

  return serializeShareInfo({ uuid, encryptedKey });
}

export async function loadSharedChat(fragment) {
  const { uuid, encryptedKey } = parseShareInfo(fragment);
  const snapshot = await getDoc(doc(useNuxtApp().$firestore, "data", uuid));
  if (!snapshot.exists()) throw new Error("No such share link");

  return parseSharePayload(
    await decryptBytes(snapshot.data().data, encryptedKey),
  );
}
