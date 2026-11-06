import { STORES, request, transact } from "./database";
import { newId } from "./chats";

/**
 * What a saved chat gathers over time, one record each: AI readings and coach
 * conversations now, notes, pinned messages and purchases later
 * (docs/saved-chats.md). An artifact belongs to one chat and is forgotten
 * with it.
 *
 * `data` is plain JSON: it goes into backups as JSON, so a Date or a Vue
 * proxy has no business in it.
 */

/** A chat's artifacts, newest first, optionally of one kind only. */
export async function listArtifacts(chatId, kind) {
  const all = await transact([STORES.artifacts], "readonly", (tx) =>
    request(tx.objectStore(STORES.artifacts).index("chatId").getAll(chatId)),
  );
  return all
    .filter((artifact) => !kind || artifact.kind === kind)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Add an artifact to a saved chat. Resolves with it, or with null when the
 * chat is no longer saved: a reading that finishes after "Don't keep" must not
 * be left behind with nothing to belong to.
 */
export async function addArtifact(chatId, kind, data, options = {}) {
  const { now = Date.now(), ref = null } = options;
  const artifact = {
    id: newId(),
    chatId,
    kind,
    ref,
    createdAt: now,
    updatedAt: now,
    data,
  };
  return transact([STORES.chats, STORES.artifacts], "readwrite", async (tx) => {
    const chat = await request(tx.objectStore(STORES.chats).get(chatId));
    if (!chat) return null;
    tx.objectStore(STORES.artifacts).put(artifact);
    return artifact;
  });
}

/**
 * Add or replace the one artifact of this kind and `ref` on a chat, such as
 * the coach conversation that goes with one reading. Null when the chat is
 * gone.
 */
export async function keepArtifact(chatId, kind, ref, data, options = {}) {
  const { now = Date.now() } = options;
  return transact([STORES.chats, STORES.artifacts], "readwrite", async (tx) => {
    const chat = await request(tx.objectStore(STORES.chats).get(chatId));
    if (!chat) return null;
    const store = tx.objectStore(STORES.artifacts);
    const all = await request(store.index("chatId").getAll(chatId));
    const known = all.find((a) => a.kind === kind && a.ref === ref);
    const artifact = known
      ? { ...known, data, updatedAt: now }
      : {
          id: newId(),
          chatId,
          kind,
          ref,
          createdAt: now,
          updatedAt: now,
          data,
        };
    store.put(artifact);
    return artifact;
  });
}

/** Put artifacts back as they were, e.g. from a backup. */
export async function putArtifacts(artifacts) {
  if (!artifacts.length) return;
  await transact([STORES.artifacts], "readwrite", (tx) => {
    const store = tx.objectStore(STORES.artifacts);
    for (const artifact of artifacts) store.put(artifact);
  });
}
