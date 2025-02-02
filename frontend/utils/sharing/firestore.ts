// store functions

import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { decryptData, encryptData, generateKey } from "~/utils/sharing/crypto";

type ShareableKey = { iv: number[]; key: ArrayBuffer };

export type ShareInfo = { uuid: string; encryptedKey: ShareableKey };

export async function storeResult(data: string): Promise<ShareInfo> {
  console.log("was called!");
  const uuid = uuidv4();
  const key = await generateKey();
  console.log("generated key", key);
  const encryptedData = await encryptData(data, key);

  const firestore = useNuxtApp().$firestore;

  console.log("encryptedData", { uuid, key, encryptedData, firestore });

  const d = doc(firestore, "data", uuid);
  console.log("d", d);
  await setDoc(d, {
    data: encryptedData,
  });

  // You may want to export the key in a way that it can be shared
  const exportedKey = {
    iv: Array.from(key.iv),
    key: await crypto.subtle.exportKey("raw", key.cryptoKey),
  };
  console.log("exportedkey", exportedKey);

  return { uuid, encryptedKey: exportedKey };
}

export async function retrieveResult({
  uuid,
  encryptedKey,
}: ShareInfo): Promise<string> {
  const firestore = useNuxtApp().$firestore;
  const docRef = doc(firestore, "data", uuid);
  const docSnap = await getDoc(docRef);
  console.log("retrieve Result", { uuid, encryptedKey, docRef, docSnap });
  if (docSnap.exists()) {
    console.log("document exists");
    const key = await crypto.subtle.importKey(
      "raw",
      encryptedKey.key,
      "AES-GCM",
      true,
      ["decrypt"],
    );
    const document = docSnap.data();
    console.log("document", document.data);
    const decrypted_document = await decryptData(document.data, {
      cryptoKey: key,
      iv: new Uint8Array(encryptedKey.iv),
    });
    console.log("decrypted docyment", decrypted_document);
    return decrypted_document;
  } else {
    throw new Error("No such document!");
  }
}
