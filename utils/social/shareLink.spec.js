import { deflate } from "pako";
import {
  SHARE_PAYLOAD_VERSION,
  buildShareLinkUrl,
  buildSharePayload,
  decodeShareToken,
  encodeShareToken,
  parseSharePayload,
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

describe("share token", () => {
  const parts = {
    id: new Uint8Array(16).fill(7),
    iv: new Uint8Array(12).fill(9),
    key: new Uint8Array(32).fill(3).buffer,
  };

  it("round-trips the id, nonce and key through one blob", () => {
    const decoded = decodeShareToken(`#${encodeShareToken(parts)}`);

    expect(Array.from(decoded.id)).toEqual(Array.from(parts.id));
    expect(Array.from(decoded.iv)).toEqual(Array.from(parts.iv));
    expect(Array.from(new Uint8Array(decoded.key))).toEqual(
      Array.from(new Uint8Array(parts.key)),
    );
  });

  it("reads a token that still carries its leading hash", () => {
    const token = encodeShareToken(parts);

    expect(Array.from(decodeShareToken(token).id)).toEqual(
      Array.from(decodeShareToken(`#${token}`).id),
    );
  });

  it("needs no percent-encoding in a URL", () => {
    const token = encodeShareToken(parts);

    // base64url only, so the link carries no %5B and no padding to escape.
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it("rejects a truncated link", () => {
    expect(() =>
      decodeShareToken(`#${encodeShareToken(parts).slice(0, 40)}`),
    ).toThrow("Incomplete share link");
  });
});

describe("buildShareLinkUrl", () => {
  it("is a path and a fragment, and nothing else", () => {
    const token = encodeShareToken({
      id: new Uint8Array(16).fill(7),
      iv: new Uint8Array(12).fill(9),
      key: new Uint8Array(32).fill(3).buffer,
    });
    const url = buildShareLinkUrl("https://whatsanalyze.com/", "/de/s", token);

    // Everything before the hash is what the server and any Referer header
    // get to see, so the key must not appear in it -- and there is no query
    // string left to carry anything else either.
    const [sent, fragment] = url.split("#");
    expect(sent).toBe("https://whatsanalyze.com/de/s");
    expect(fragment).toBe(token);
    expect(url.length).toBeLessThan(115);
  });
});
