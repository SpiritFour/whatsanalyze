// store functions

import { getApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore/lite";
import { v4 as uuidv4 } from "uuid";
import {
  decryptData,
  encryptData,
  generateKey,
} from "~/utils/wrapped/sharing/crypto";

type ShareableKey = { iv: number[]; key: ArrayBuffer };

/**
 * Firestore's REST client rather than the streaming one: one request to
 * store a story, one to read it back, and no channel to open first. Same
 * app, same `data/{uuid}` documents as utils/social/shareLinkStore.js,
 * whose requests the e2e tests answer.
 */
const liteFirestore = () => getFirestore(getApp());

export type ShareInfo = { uuid: string; encryptedKey: ShareableKey };

/** A story encrypted on this device, its link known, not yet uploaded. */
export type PreparedShare = { info: ShareInfo; encryptedData: string };

/**
 * Everything a share link needs, worked out on the device: an id, a key and
 * the story encrypted with it. Nothing leaves the device here.
 *
 * Split from the upload so the link exists before the tap that sends it.
 * Safari only lets a page open WhatsApp straight from a tap; waiting for the
 * upload first meant it blocked the handoff and asked for a second tap.
 */
export async function prepareResult(data: string): Promise<PreparedShare> {
  const uuid = uuidv4();
  const key = await generateKey();
  const encryptedData = await encryptData(data, key);
  // The key never reaches Firestore: it travels in the share link's fragment,
  // so only someone holding the link can read the chat back.
  const encryptedKey = {
    iv: Array.from(new Uint8Array(key.iv)),
    key: await crypto.subtle.exportKey("raw", key.cryptoKey),
  };
  return { info: { uuid, encryptedKey }, encryptedData };
}

/** Stores a prepared story, encrypted, under its id. */
export async function uploadPrepared({
  info,
  encryptedData,
}: PreparedShare): Promise<void> {
  await setDoc(doc(liteFirestore(), "data", info.uuid), {
    data: encryptedData,
  });
}

export async function storeResult(data: string): Promise<ShareInfo> {
  const prepared = await prepareResult(data);
  await uploadPrepared(prepared);
  return prepared.info;
}

export class SharedStoryMissingError extends Error {
  constructor() {
    super("No such document!");
    this.name = "SharedStoryMissingError";
  }
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * Reads a shared story back. A link can reach someone a moment before its
 * story finishes uploading -- the sender's WhatsApp opens on the tap, and
 * the upload runs alongside -- so a missing story is asked for again a few
 * times before it counts as gone.
 */
export async function retrieveResult(
  { uuid, encryptedKey }: ShareInfo,
  { attempts = 4, delayMs = 1500 } = {},
): Promise<string> {
  const docRef = doc(liteFirestore(), "data", uuid);
  let docSnap = await getDoc(docRef);
  for (let attempt = 1; !docSnap.exists() && attempt < attempts; attempt++) {
    await sleep(delayMs);
    docSnap = await getDoc(docRef);
  }
  if (!docSnap.exists()) throw new SharedStoryMissingError();

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
}
