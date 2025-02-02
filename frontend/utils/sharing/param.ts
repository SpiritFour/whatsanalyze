// Function to serialize ShareInfo to query parameters
import type { ShareInfo } from "~/utils/sharing/firestore";

export function serializeShareInfo(shareInfo: ShareInfo): string {
  const { uuid, encryptedKey } = shareInfo;
  const ivStr = JSON.stringify(encryptedKey.iv);
  const keyArray = Array.from(new Uint8Array(encryptedKey.key));
  const keyStr = JSON.stringify(keyArray);

  const params = new URLSearchParams();
  params.set("uuid", uuid);
  params.set("iv", ivStr);
  params.set("key", keyStr);

  return params.toString();
}

// Function to parse query parameters back into ShareInfo
export function parseShareInfo(queryString: string): ShareInfo {
  const params = new URLSearchParams(queryString);

  const uuid = params.get("uuid");
  if (!uuid) {
    throw new Error("Invalid UUID");
  }

  const ivStr = params.get("iv");
  const keyStr = params.get("key");
  if (!ivStr || !keyStr) {
    throw new Error("Invalid ShareableKey");
  }

  const iv: number[] = JSON.parse(ivStr);
  const key: ArrayBuffer = new Uint8Array(JSON.parse(keyStr)).buffer;

  return { uuid, encryptedKey: { iv, key } };
}
