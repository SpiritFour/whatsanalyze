import {
  SHARE_PAYLOAD_VERSION,
  buildShareLinkUrl,
  buildSharePayload,
  parseShareInfo,
  parseSharePayload,
  serializeShareInfo,
} from "./shareLink";

const CARDS = [
  { id: "duel", type: "duel", title: "Who talks more?" },
  { id: "clock", type: "clock", title: "Night owl vs. early bird" },
];

describe("share payload", () => {
  it("round-trips the cards and the locale", () => {
    const payload = parseSharePayload(buildSharePayload(CARDS, "de"));

    expect(payload.version).toBe(SHARE_PAYLOAD_VERSION);
    expect(payload.locale).toBe("de");
    expect(payload.cards).toEqual(CARDS);
  });

  it("refuses a payload from a version it cannot read", () => {
    const stale = JSON.stringify({ version: 99, cards: [] });

    expect(() => parseSharePayload(stale)).toThrow("version 99");
  });

  it("refuses a payload without cards", () => {
    const empty = JSON.stringify({ version: SHARE_PAYLOAD_VERSION });

    expect(() => parseSharePayload(empty)).toThrow("no cards");
  });
});

describe("share info", () => {
  const shareInfo = {
    uuid: "3f7c1b6e",
    encryptedKey: { iv: [1, 2, 3], key: new Uint8Array([9, 8, 7]).buffer },
  };

  it("round-trips through the URL fragment", () => {
    const parsed = parseShareInfo(`#${serializeShareInfo(shareInfo)}`);

    expect(parsed.uuid).toBe("3f7c1b6e");
    expect(parsed.encryptedKey.iv).toEqual([1, 2, 3]);
    expect(Array.from(new Uint8Array(parsed.encryptedKey.key))).toEqual([
      9, 8, 7,
    ]);
  });

  it("reads a fragment that still carries its leading hash", () => {
    const serialized = serializeShareInfo(shareInfo);

    expect(parseShareInfo(serialized).uuid).toBe(
      parseShareInfo(`#${serialized}`).uuid,
    );
  });

  it("rejects a link missing part of the key", () => {
    expect(() => parseShareInfo("#uuid=3f7c1b6e&iv=[1,2]")).toThrow(
      "Incomplete share link",
    );
  });
});

describe("buildShareLinkUrl", () => {
  it("keeps the key in the fragment and the UTM tags in the query", () => {
    const url = buildShareLinkUrl(
      "https://whatsanalyze.com/",
      "/de/shared",
      "uuid=abc&key=%5B1%5D",
    );

    // Everything before the hash is what the server and any Referer header
    // get to see, so the key must not appear in it.
    const [sent, fragment] = url.split("#");
    expect(sent).toBe(
      "https://whatsanalyze.com/de/shared?utm_source=user_share&utm_medium=link",
    );
    expect(fragment).toBe("uuid=abc&key=%5B1%5D");
  });
});
