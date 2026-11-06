import { STORES, request, transact } from "./database";

/**
 * The library's settings, one record in `meta`. Kept with the chats rather
 * than in localStorage, so "Forget everything" takes them along.
 */
const SETTINGS = "settings";

export const DEFAULT_SETTINGS = {
  /** "Forget chats not opened in 90 days": off unless the visitor turns it on. */
  autoForget: false,
};

export async function readSettings() {
  const record = await transact([STORES.meta], "readonly", (tx) =>
    request(tx.objectStore(STORES.meta).get(SETTINGS)),
  );
  return { ...DEFAULT_SETTINGS, ...record?.value };
}

export async function writeSettings(change) {
  return transact([STORES.meta], "readwrite", async (tx) => {
    const store = tx.objectStore(STORES.meta);
    const record = await request(store.get(SETTINGS));
    const value = { ...DEFAULT_SETTINGS, ...record?.value, ...change };
    store.put({ name: SETTINGS, value });
    return value;
  });
}
