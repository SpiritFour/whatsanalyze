/**
 * The export a visitor dropped on a court evidence page, kept for the tab.
 *
 * sessionStorage only holds the messages, so a reload, and every return from
 * Stripe Checkout, used to lose the media the exhibit index hashes. The File
 * itself is kept in IndexedDB instead, which can hold hundreds of megabytes.
 *
 * IndexedDB outlives the tab, sessionStorage does not: the file is stored
 * next to a token in sessionStorage, and a tab without that token (a new
 * visit) wipes whatever an earlier one left behind. The chat never leaves
 * the device either way.
 */
const DB_NAME = "whatsanalyze_upload";
const STORE = "files";
const KEY = "export";
const SESSION_KEY = "whatsanalyze_upload_session";

interface StoredUpload {
  token: string;
  file: File;
}

const open = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const run = async <T>(
  mode: "readonly" | "readwrite",
  // eslint-disable-next-line no-unused-vars -- a parameter of the type, not a binding
  action: (store: IDBObjectStore) => IDBRequest,
): Promise<T> => {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

export async function saveUpload(file: File): Promise<void> {
  try {
    const token = crypto.randomUUID();
    await run("readwrite", (store) =>
      store.put({ token, file } satisfies StoredUpload, KEY),
    );
    sessionStorage.setItem(SESSION_KEY, token);
  } catch (err) {
    // private mode or a full disk: the chat still works, the media just
    // has to be dropped again after a reload
    console.warn("Could not keep the upload for this tab:", err);
  }
}

export async function loadUpload(): Promise<File | null> {
  try {
    const stored = await run<StoredUpload | undefined>("readonly", (store) =>
      store.get(KEY),
    );
    if (!stored) return null;
    if (stored.token !== sessionStorage.getItem(SESSION_KEY)) {
      await clearUpload();
      return null;
    }
    return stored.file;
  } catch (err) {
    console.warn("Could not read the kept upload:", err);
    return null;
  }
}

export async function clearUpload(): Promise<void> {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    await run("readwrite", (store) => store.delete(KEY));
  } catch (err) {
    console.warn("Could not clear the kept upload:", err);
  }
}
