/**
 * The pictures of a Pro chat design (wallpaper photo, cover photo), kept for
 * the tab.
 *
 * They are chosen before checkout and needed after it: Stripe sends the buyer
 * back with a full page load, and the PDF they paid for is built from the
 * design they made. Photos are too big for localStorage, so they live in
 * IndexedDB, under the same rule as the uploaded export (utils/uploadStore.ts):
 * tied to this tab by a token in sessionStorage, wiped by the next visit.
 * Nothing here leaves the device.
 */
const DB_NAME = "whatsanalyze_pdf_design";
const STORE = "images";
const SESSION_KEY = "whatsanalyze_pdf_design_session";

export type DesignImageKey = "wallpaper" | "cover";

interface StoredImage {
  token: string;
  blob: Blob;
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

function sessionToken(): string {
  let token = sessionStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

export async function saveDesignImage(
  key: DesignImageKey,
  blob: Blob,
): Promise<void> {
  try {
    await run("readwrite", (store) =>
      store.put({ token: sessionToken(), blob } satisfies StoredImage, key),
    );
  } catch (err) {
    // private mode or a full disk: the design works, the photo just has to
    // be chosen again after a reload
    console.warn("Could not keep the design photo for this tab:", err);
  }
}

export async function loadDesignImage(
  key: DesignImageKey,
): Promise<Blob | null> {
  try {
    const stored = await run<StoredImage | undefined>("readonly", (store) =>
      store.get(key),
    );
    if (!stored) return null;
    if (stored.token !== sessionStorage.getItem(SESSION_KEY)) {
      await clearDesignImage(key);
      return null;
    }
    return stored.blob;
  } catch (err) {
    console.warn("Could not read the design photo:", err);
    return null;
  }
}

export async function clearDesignImage(key: DesignImageKey): Promise<void> {
  try {
    await run("readwrite", (store) => store.delete(key));
  } catch (err) {
    console.warn("Could not clear the design photo:", err);
  }
}
