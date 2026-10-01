import { deflate } from "pako";
import {
  SHARE_PAYLOAD_VERSION,
  buildShareLinkUrl,
  buildSharePayload,
  parseShareInfo,
  parseSharePayload,
  serializeShareInfo,
} from "./shareLink";

const SNAPSHOT = {
  version: SHARE_PAYLOAD_VERSION,
  totalMessages: 2,
  firstDate: new Date("2024-01-01T23:30:00.000Z"),
  lastDate: new Date("2024-01-02T07:10:00.000Z"),
  numPersonsInChat: 2,
  people: [{ name: "Alex Morgan", color: "#21a68d" }],
  socialStats: {
    start: new Date("2024-01-01T23:30:00.000Z"),
    end: new Date("2024-01-02T07:10:00.000Z"),
    people: [],
  },
};

describe("share payload", () => {
  it("revives the dates the charts call Date methods on", () => {
    const restored = parseSharePayload(buildSharePayload(SNAPSHOT));

    expect(restored.firstDate).toBeInstanceOf(Date);
    expect(restored.lastDate).toBeInstanceOf(Date);
    expect(restored.socialStats.start).toBeInstanceOf(Date);
    expect(restored.firstDate.toISOString()).toBe(
      SNAPSHOT.firstDate.toISOString(),
    );
  });

  it("refuses a payload from a version it cannot read", () => {
    const stale = deflate(JSON.stringify({ ...SNAPSHOT, version: 99 }));

    expect(() => parseSharePayload(stale)).toThrow("version 99");
  });

  it("refuses a payload carrying no analysis", () => {
    const empty = deflate(
      JSON.stringify({ version: SHARE_PAYLOAD_VERSION, people: [] }),
    );

    expect(() => parseSharePayload(empty)).toThrow("no analysis");
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
