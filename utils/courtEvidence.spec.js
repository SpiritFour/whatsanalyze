/**
 * @jest-environment node
 */
/* eslint-env jest */
import { webcrypto } from "crypto";
import {
  SYSTEM_SPEAKER,
  buildCanonicalTranscript,
  buildRoster,
  buildTranscript,
  exhibitLabel,
  formatExactTimestamp,
  formatFileSize,
  formatHash,
  isDeletedMessage,
  isSystemMessage,
  normalizeMessageText,
  sha256Hex,
} from "~/utils/courtEvidence";

// Browsers and web workers have Web Crypto as a global, jest's node
// environment does not.
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const message = (author, text, date, attachment) => ({
  author,
  message: text,
  date: new Date(date),
  ...(attachment ? { attachment: { fileName: attachment } } : {}),
});

const chat = [
  message(
    "System",
    "Messages are end-to-end encrypted.",
    "2023-04-01T10:00:00"
  ),
  message("Alice", "Hi Bob", "2023-04-01T10:01:02"),
  message(
    "Bob",
    "IMG-0001.jpg (file attached)",
    "2023-04-01T10:02:03",
    "IMG-0001.jpg"
  ),
  message("Alice", "This message was deleted", "2023-04-02T22:15:59"),
  message(
    "Carol Unknown",
    "Carol joined using this group's invite link",
    "2023-04-03T08:00:00"
  ),
  message(
    "Bob",
    "VID-0002.mp4 (file attached)",
    "2023-04-03T09:30:00",
    "VID-0002.mp4"
  ),
];
const participants = ["Alice", "Bob"];

describe("timestamps", () => {
  it("prints seconds, so entries can be compared to other records", () => {
    expect(formatExactTimestamp(new Date("2023-04-01T10:01:02"))).toBe(
      "2023-04-01 10:01:02"
    );
  });

  it("accepts the ISO strings the web worker receives", () => {
    const iso = new Date("2023-04-01T10:01:02").toISOString();
    expect(formatExactTimestamp(iso)).toBe("2023-04-01 10:01:02");
  });

  it("stays empty for unusable dates instead of printing 'Invalid date'", () => {
    expect(formatExactTimestamp("not a date")).toBe("");
  });
});

describe("message classification", () => {
  it("treats authors that are not participants as system notices", () => {
    expect(isSystemMessage(chat[0], participants)).toBe(true);
    expect(isSystemMessage(chat[4], participants)).toBe(true);
    expect(isSystemMessage(chat[1], participants)).toBe(false);
  });

  it("recognises deletion notices in every language we ship", () => {
    expect(isDeletedMessage({ message: "This message was deleted" })).toBe(
      true
    );
    expect(
      isDeletedMessage({ message: "Diese Nachricht wurde gelöscht" })
    ).toBe(true);
    expect(isDeletedMessage({ message: "Ce message a été supprimé" })).toBe(
      true
    );
    expect(isDeletedMessage({ message: "Deleted my account" })).toBe(false);
  });

  it("drops WhatsApp's control characters but keeps the wording", () => {
    expect(normalizeMessageText("‎Guten Tag\r\nwie geht's?")).toBe(
      "Guten Tag\nwie geht's?"
    );
  });
});

describe("buildTranscript", () => {
  const { rows, exhibits, stats } = buildTranscript(chat, participants);

  it("numbers every row, including system notices", () => {
    expect(rows.map((row) => row.lineNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows[0].speaker).toBe(SYSTEM_SPEAKER);
    expect(rows[4].speaker).toBe(SYSTEM_SPEAKER);
    expect(rows[4].text).toBe("Carol joined using this group's invite link");
  });

  it("links each attachment to the exhibit listed in the annex", () => {
    expect(rows[2].exhibit).toBe("A-01");
    expect(rows[5].exhibit).toBe("A-02");
    expect(exhibits.map((exhibit) => exhibit.fileName)).toEqual([
      "IMG-0001.jpg",
      "VID-0002.mp4",
    ]);
    expect(exhibits[1]).toMatchObject({
      label: "A-02",
      lineNumber: 6,
      sender: "Bob",
      fileType: "MP4",
      timestamp: "2023-04-03 09:30:00",
    });
  });

  it("counts what the cover page has to declare", () => {
    expect(stats).toMatchObject({
      total: 6,
      media: 2,
      deleted: 1,
      system: 2,
      start: "2023-04-01 10:00:00",
      end: "2023-04-03 09:30:00",
    });
  });
});

describe("buildRoster", () => {
  it("lists participants by volume, with their first and last message", () => {
    const roster = buildRoster(chat, participants);
    expect(roster).toEqual([
      {
        name: "Alice",
        messages: 2,
        first: "2023-04-01 10:01:02",
        last: "2023-04-02 22:15:59",
      },
      {
        name: "Bob",
        messages: 2,
        first: "2023-04-01 10:02:03",
        last: "2023-04-03 09:30:00",
      },
    ]);
  });
});

describe("exhibitLabel", () => {
  it("rolls over to the next letter after 99 exhibits", () => {
    expect(exhibitLabel(0)).toBe("A-01");
    expect(exhibitLabel(98)).toBe("A-99");
    expect(exhibitLabel(99)).toBe("B-01");
    expect(exhibitLabel(26 * 99)).toBe("AA-01");
  });
});

describe("hashing", () => {
  it("matches the SHA-256 a recipient computes with shasum", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("hashes raw bytes the same way as the shell does", async () => {
    expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("prints hashes in readable blocks", () => {
    expect(formatHash("a".repeat(64))).toEqual([
      "aaaaaaaa aaaaaaaa aaaaaaaa aaaaaaaa",
      "aaaaaaaa aaaaaaaa aaaaaaaa aaaaaaaa",
    ]);
    expect(formatHash(null)).toEqual(["—"]);
  });

  it("hashes a transcript that can be rebuilt from the printed page", () => {
    const { rows } = buildTranscript(chat.slice(1, 3), participants);
    expect(buildCanonicalTranscript(rows)).toBe(
      "1\t2023-04-01 10:01:02\tAlice\tHi Bob\n" +
        "2\t2023-04-01 10:02:03\tBob\tIMG-0001.jpg (file attached)"
    );
  });
});

describe("formatFileSize", () => {
  it("keeps the annex readable", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatFileSize(NaN)).toBe("—");
  });
});
