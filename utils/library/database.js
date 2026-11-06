/**
 * Saved chats live in one IndexedDB database in the visitor's browser. It is
 * only ever read and written here, and nothing in it is sent anywhere
 * (docs/saved-chats.md).
 *
 * Hand-rolled like utils/uploadStore.ts rather than built on `idb`: a few
 * promise wrappers are all this needs.
 *
 * Version 1 creates every store the design names, including the ones later
 * steps fill (derived, memory, media), so those steps add code and need no
 * migration. Stores keyed by [chatId, …] keep a chat's records next to each
 * other, so one key range reads or deletes all of them.
 */
export const DB_NAME = "whatsanalyze_library";
const DB_VERSION = 1;

export const STORES = {
  /** One record per chat: its title, people, dates, counts and sources. */
  chats: "chats",
  /** [chatId, "YYYY-MM"]: that month's messages, gzipped. */
  months: "months",
  /** [chatId, month, kind, version]: per-month numbers (step 3). */
  derived: "derived",
  /** AI readings, coach conversations, later notes and purchases. */
  artifacts: "artifacts",
  /** [chatId, period, kind, model]: what the on-device AI found (step 5). */
  memory: "memory",
  /** The export file itself, for court evidence chats only (step 3). */
  media: "media",
  /** Settings, and later the lock's salt and check value. */
  meta: "meta",
};

/** Every store that holds something about one chat. */
export const CHAT_STORES = [
  STORES.chats,
  STORES.months,
  STORES.derived,
  STORES.artifacts,
  STORES.memory,
  STORES.media,
];

function createStores(db) {
  db.createObjectStore(STORES.chats, { keyPath: "id" });
  db.createObjectStore(STORES.months, { keyPath: ["chatId", "month"] });
  db.createObjectStore(STORES.derived, {
    keyPath: ["chatId", "month", "kind", "version"],
  });
  db.createObjectStore(STORES.artifacts, { keyPath: "id" }).createIndex(
    "chatId",
    "chatId",
  );
  db.createObjectStore(STORES.memory, {
    keyPath: ["chatId", "period", "kind", "model"],
  });
  db.createObjectStore(STORES.media, { keyPath: "chatId" });
  db.createObjectStore(STORES.meta, { keyPath: "name" });
}

/**
 * Every key that starts with this chat's id. An array sorts after any string,
 * so [id, []] is past every [id, "2019-05", …] there can be.
 */
export const chatRange = (chatId) => IDBKeyRange.bound([chatId], [chatId, []]);

/** @type {Promise<IDBDatabase> | null} */
let connection = null;

/**
 * The database, opened once per tab and created on first use. A refusal (a
 * blocked or unavailable storage) is not remembered: the next call asks again.
 */
export function openLibrary() {
  if (!connection) {
    const opening = new Promise((resolve, reject) => {
      // Throws instead of failing the request where storage is blocked
      // outright; the promise turns that into a rejection either way.
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => createStores(request.result);
      request.onsuccess = () => {
        const db = request.result;
        // "Forget everything" in another tab deletes the database, which has
        // to wait until every tab has let go of it.
        db.onversionchange = () => {
          db.close();
          if (connection === opening) connection = null;
        };
        // Closed by the browser, e.g. when the visitor clears site data.
        db.onclose = () => {
          if (connection === opening) connection = null;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
    opening.catch(() => {
      if (connection === opening) connection = null;
    });
    connection = opening;
  }
  return connection;
}

/** Let go of the database, so it can be deleted (and in tests, replaced). */
export async function closeLibrary() {
  const open = connection;
  connection = null;
  const db = await open?.catch(() => null);
  db?.close();
}

/** One request, as a promise. */
export const request = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

/**
 * Run `work` in one transaction and resolve with what it returns once the
 * transaction has committed, so a chat is never left half written.
 *
 * `work` may await requests on the transaction, but nothing else: a
 * transaction commits as soon as it has nothing left to do, so anything slow
 * (compressing, hashing) has to happen before it starts. A transaction that
 * aborts rejects with the reason, `QuotaExceededError` on a full disk.
 */
export async function transact(stores, mode, work) {
  const db = await openLibrary();
  const tx = db.transaction(stores, mode);
  const committed = new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error ?? new DOMException("Transaction aborted", "AbortError"));
  });
  // Handled here so an abort that `work` already reports is not also an
  // unhandled rejection.
  committed.catch(() => {});

  let result;
  try {
    result = await work(tx);
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // It had already finished or aborted on its own.
    }
    throw error;
  }
  await committed;
  return result;
}

/**
 * Whether this browser has a library, found out without creating one: most
 * visitors never keep a chat, and they should not get a database for asking.
 * Null where the browser cannot say without opening it.
 */
export async function libraryExists() {
  if (typeof indexedDB === "undefined") return false;
  if (typeof indexedDB.databases !== "function") return null;
  const databases = await indexedDB.databases();
  return databases.some((db) => db.name === DB_NAME);
}

/** Delete the whole database: every chat, reading, setting and index. */
export async function deleteLibrary() {
  await closeLibrary();
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    // Other tabs close their connection on `versionchange`, and the delete
    // goes ahead once they have, so `blocked` needs nothing of its own.
  });
}
