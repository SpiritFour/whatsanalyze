// store functions

import type { Firestore } from "firebase/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import {
  decryptData,
  encryptData,
  generateKey,
} from "~/utils/wrapped/sharing/crypto";

type ShareableKey = { iv: number[]; key: ArrayBuffer };

export type ShareInfo = { uuid: string; encryptedKey: ShareableKey };

export async function storeResult(data: string): Promise<ShareInfo> {
  const uuid = uuidv4();
  const key = await generateKey();
  const encryptedData = await encryptData(data, key);

  const firestore = useNuxtApp().$firestore as Firestore;

  await setDoc(doc(firestore, "data", uuid), {
    data: encryptedData,
  });

  // The key never reaches Firestore: it travels in the share link's fragment,
  // so only someone holding the link can read the chat back.
  const exportedKey = {
    iv: Array.from(new Uint8Array(key.iv)),
    key: await crypto.subtle.exportKey("raw", key.cryptoKey),
  };

  return { uuid, encryptedKey: exportedKey };
}

export async function retrieveResult({
  uuid,
  encryptedKey,
}: ShareInfo): Promise<string> {
  const firestore = useNuxtApp().$firestore as Firestore;
  const docRef = doc(firestore, "data", uuid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const key = await crypto.subtle.importKey(
      "raw",
      encryptedKey.key,
      "AES-GCM",
      true,
      ["decrypt"],
    );
    const document = docSnap.data();
    return await decryptData(document.data, {
      cryptoKey: key,
      iv: new Uint8Array(encryptedKey.iv).buffer,
    });
  } else {
    throw new Error("No such document!");
  }
}
