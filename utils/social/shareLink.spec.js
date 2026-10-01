import { deflate } from "pako";
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
    author: "Jordan Blake",
    date: new Date("2024-01-02T07:10:00.000Z"),
    message: "servus 👍",
    absolute_id: 1,
  },
];

describe("share payload", () => {
  it("round-trips the messages with their dates intact", () => {
    const messages = parseSharePayload(buildSharePayload(MESSAGES));

    expect(messages).toHaveLength(2);
    expect(messages[0].author).toBe("Alex Morgan");
    expect(messages[1].message).toBe("servus 👍");
    // JSON has no date type, and everything downstream calls Date methods on
    // this, so a string here would throw on the first chart.
    expect(messages[0].date).toBeInstanceOf(Date);
    expect(messages[0].date.toISOString()).toBe("2024-01-01T23:30:00.000Z");
  });

  it("compresses, which is what keeps a chat inside a Firestore document", () => {
    const many = Array.from({ length: 2000 }, (_, index) => ({
      ...MESSAGES[0],
      absolute_id: index,
    }));

    expect(buildSharePayload(many).length).toBeLessThan(
      JSON.stringify(many).length / 5,
    );
  });

  it("refuses a payload from a version it cannot read", () => {
    const stale = deflate(JSON.stringify({ version: 99, messages: [] }));

    expect(() => parseSharePayload(stale)).toThrow("version 99");
  });

  it("refuses a payload with no messages", () => {
    const empty = deflate(
      JSON.stringify({ version: SHARE_PAYLOAD_VERSION, messages: [] }),
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
