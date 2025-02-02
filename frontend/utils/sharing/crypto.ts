type Key = { cryptoKey: CryptoKey; iv: Uint8Array };

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptData(data: string, key: Key): Promise<string> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: key.iv,
    },
    key.cryptoKey,
    encodedData,
  );
  return arrayBufferToBase64(encrypted);
}

export async function decryptData(encryptedData: string, key: Key) {
  try {
    const encryptedArrayBuffer = base64ToArrayBuffer(encryptedData);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: key.iv,
      },
      key.cryptoKey,
      encryptedArrayBuffer,
    );
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (e) {
    console.error("decrypting error", e);
    throw e;
  }
}
export async function generateKey(): Promise<Key> {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { cryptoKey: key, iv };
}
