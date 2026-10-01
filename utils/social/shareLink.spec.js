import { deflate, inflate } from "pako";
import {
  SHARE_PAYLOAD_VERSION,
  buildShareLinkUrl,
  buildSharePayload,
  parseShareInfo,
  parseSharePayload,
  serializeShareInfo,
} from "./shareLink";

const MESSAGES = [
  {
    author: "Alex Morgan",
    date: new Date("2024-01-01T23:30:00.000Z"),
    message: "hey there",
    absolute_id: 0,
  },
  {
    author: "System",
    date: new Date("2024-01-01T23:31:00.000Z"),
    message: "Messages are end-to-end encrypted",
    absolute_id: 1,
  },
  {
    author: "Jordan Blake",
    date: new Date("2024-01-02T07:10:00.000Z"),
    message: "servus 👍",
    absolute_id: 2,
    attachment: { fileName: "PTT-20240102.opus" },
  },
];

describe("share payload", () => {
  it("round-trips every message unchanged", () => {
    expect(parseSharePayload(buildSharePayload(MESSAGES))).toEqual(MESSAGES);
  });

  it("keeps the dates as Dates", () => {
    const [first] = parseSharePayload(buildSharePayload(MESSAGES));

    // JSON has no date type, and everything downstream calls Date methods on
    // this, so a string here would throw on the first chart.
    expect(first.date).toBeInstanceOf(Date);
    expect(first.date.toISOString()).toBe("2024-01-01T23:30:00.000Z");
  });

  it("stores no more than the source", () => {
    // The payload has to be the messages and nothing derived from them, so
    // that the other side recomputes the analysis rather than trusting one.
    const packed = JSON.parse(
      new TextDecoder().decode(inflate(buildSharePayload(MESSAGES))),
    );

    expect(Object.keys(packed).sort()).toEqual([
      "attachments",
      "authors",
      "base",
      "gaps",
      "texts",
      "version",
      "who",
    ]);
  });

  it("packs a long chat far smaller than one object per message", () => {
    const many = Array.from({ length: 5000 }, (_, index) => ({
      author: index % 2 ? "Alex Morgan" : "Jordan Blake",
      date: new Date(Date.UTC(2024, 0, 1) + index * 60000),
      message: "thanks, see you tomorrow",
      absolute_id: index,
    }));

    const naive = new TextEncoder().encode(JSON.stringify(many)).length;
    expect(buildSharePayload(many).length).toBeLessThan(naive / 50);
  });

  it("refuses a payload from a version it cannot read", () => {
    const stale = deflate(JSON.stringify({ version: 99, texts: [] }));

    expect(() => parseSharePayload(stale)).toThrow("version 99");
  });

  it("refuses a payload with no messages", () => {
    const empty = deflate(
      JSON.stringify({ version: SHARE_PAYLOAD_VERSION, texts: [] }),
    );

    expect(() => parseSharePayload(empty)).toThrow("no messages");
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
