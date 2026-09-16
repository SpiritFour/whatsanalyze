export const SHARE_PAYLOAD_VERSION = 1;

/**
 * What a share link actually carries: the finished card descriptors, not the
 * chat and not the stats they were derived from.
 *
 * That is deliberate. The privacy options are applied while the cards are
 * built, so a link made with names masked or counts hidden has no names and
 * no counts left in it to recover -- what the sender saw in the preview is
 * exactly, and only, what was stored.
 */
export function buildSharePayload(cards, locale) {
  return JSON.stringify({
    version: SHARE_PAYLOAD_VERSION,
    locale,
    cards,
  });
}

export function parseSharePayload(json) {
  const payload = JSON.parse(json);
  if (payload.version !== SHARE_PAYLOAD_VERSION) {
    throw new Error(`Unsupported share payload version ${payload.version}`);
  }
  if (!Array.isArray(payload.cards)) {
    throw new Error("Share payload has no cards");
  }
  return payload;
}

/**
 * The uuid, iv and key go in the URL fragment, which browsers never send: not
 * to the host, not in a Referer, not in the page URL analytics records. Only
 * the UTM tags stay in the query, so the visit still counts as its own source.
 */
export function serializeShareInfo({ uuid, encryptedKey }) {
  const params = new URLSearchParams();
  params.set("uuid", uuid);
  params.set("iv", JSON.stringify(encryptedKey.iv));
  params.set(
    "key",
    JSON.stringify(Array.from(new Uint8Array(encryptedKey.key))),
  );
  return params.toString();
}

export function parseShareInfo(fragment) {
  const params = new URLSearchParams(String(fragment).replace(/^#/, ""));
  const uuid = params.get("uuid");
  const iv = params.get("iv");
  const key = params.get("key");
  if (!uuid || !iv || !key) throw new Error("Incomplete share link");

  return {
    uuid,
    encryptedKey: {
      iv: JSON.parse(iv),
      key: new Uint8Array(JSON.parse(key)).buffer,
    },
  };
}

export function buildShareLinkUrl(origin, path, fragment) {
  const base = String(origin).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}?utm_source=user_share&utm_medium=link#${fragment}`;
}
