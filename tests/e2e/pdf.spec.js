/**
 * The PDF export. These assertions are about the two properties the export
 * exists for and that are easy to lose silently in a refactor: the text is real
 * text rather than a picture of text, and emoji are colour artwork.
 */
const fs = require("node:fs/promises");
const zlib = require("node:zlib");
const JSZip = require("jszip");
const { analyzeChat, expect, test } = require("./fixtures");

/**
 * The page content streams, inflated. Object dictionaries stay readable in the
 * raw file, but the drawing operators are Flate-compressed, so asserting on
 * them means decompressing first.
 */
const contentStreams = (pdf) => {
  let decoded = "";
  const marker = Buffer.from("stream");
  let at = pdf.indexOf(marker);

  while (at !== -1) {
    let start = at + marker.length;
    if (pdf[start] === 0x0d) start++;
    if (pdf[start] === 0x0a) start++;

    const end = pdf.indexOf(Buffer.from("endstream"), start);
    if (end === -1) break;

    try {
      decoded += zlib.inflateSync(pdf.subarray(start, end)).toString("latin1");
    } catch {
      // Not a Flate stream (or not a stream at all) — nothing to read here.
    }
    // Past the whole "endstream" keyword: it ends in "stream" itself, and
    // landing back inside it would skip the streams that follow.
    at = pdf.indexOf(marker, end + "endstream".length);
  }

  return decoded;
};

/** A 24x24 PNG, small enough to inline and real enough to decode. */
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR4nGO4o2FDFcQwatCoQaMGjRo0atCoQQNvEAC/R9AfJCCrhAAAAABJRU5ErkJggg==";

/**
 * A zip export, the shape an attachment actually arrives in: the image is a
 * deflated entry the app has to inflate itself before it can be drawn.
 */
const zipChatWithImage = async () => {
  const zip = new JSZip();
  zip.file(
    "_chat.txt",
    [
      "1/2/21, 09:00 - Messages and calls are end-to-end encrypted.",
      "1/2/21, 09:01 - John Doe: Here is the picture",
      "1/2/21, 09:02 - John Doe: IMG-0001.png (file attached)",
      "1/2/21, 09:03 - Jane Doe: Got it",
    ].join("\n")
  );
  zip.file("IMG-0001.png", Buffer.from(PNG_BASE64, "base64"));

  return {
    name: "chat.zip",
    mimeType: "application/zip",
    buffer: await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    }),
  };
};

/** One message per emoji shape the acceptance criteria call out. */
const EMOJI_LINES = [
  "Single emoji: 😂 and 👍 and ❤️",
  "Skin tones: 👋🏻 👋🏼 👋🏽 👋🏾 👋🏿",
  "ZWJ families: 👨‍👩‍👧‍👦 👩‍❤️‍💋‍👨 🧑‍🤝‍🧑",
  "Professions: 👩🏽‍💻 👨🏿‍🚀 🧑‍🍳 👮🏻‍♀️",
  "Flags: 🇩🇪 🇬🇧 🇺🇸 🏳️‍🌈",
  "Mixed into text like this 🎉 right in 🥳 the middle 🍕 of a sentence",
  "Unicode text: Grüße, naïve café, Straße — em dash and ellipsis…",
];

const emojiChat = () => {
  const lines = [
    "1/2/21, 09:00 - Messages and calls are end-to-end encrypted.",
  ];
  EMOJI_LINES.forEach((text, index) => {
    const author = index % 2 ? "Jane Doe" : "John Doe";
    lines.push(
      `1/${2 + index}/21, ${9 + (index % 10)}:15 - ${author}: ${text}`
    );
  });
  // Enough messages to run onto a second page, so pagination is exercised too.
  for (let i = 0; i < 60; i++) {
    lines.push(
      `2/${1 + (i % 27)}/21, ${9 + (i % 10)}:15 - Jane Doe: filler ${i} 🎉`
    );
  }
  return {
    name: "emoji_chat.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(lines.join("\n"), "utf-8"),
  };
};

/** Runs the full export and hands back the finished file's bytes. */
const exportPdf = async (page, file) => {
  await analyzeChat(page, file);

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Download free preview PDF/i })
    .click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  return await fs.readFile(await download.path());
};

test.describe("the PDF export", () => {
  // Also on a phone: the export lays out in a fixed-width offscreen frame, and
  // a mobile browser deciding to reflow or inflate it would move every word.
  test("writes selectable text and colour emoji artwork @mobile", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    // `free` asks for the whole chat rather than the 100-message sample.
    await page.goto("/?free=1");

    const pdf = await exportPdf(page, emojiChat());
    const raw = pdf.toString("latin1");

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");

    // An embedded font program plus text-showing operators: the transcript is
    // real text, so it stays searchable, selectable and copyable. A
    // screenshot-based exporter would have neither.
    expect(raw).toContain("FontFile2");
    expect(contentStreams(pdf).match(/Tj/g)?.length ?? 0).toBeGreaterThan(100);

    // Emoji cannot be text -- PDF has no colour font tables -- so they are
    // drawn as images. No image XObjects means the artwork silently went
    // missing and the emoji came out monochrome or not at all.
    expect(raw.match(/\/Subtype \/Image/g)?.length ?? 0).toBeGreaterThan(10);
  });

  test("builds the whole document without sending the chat anywhere", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const requests = [];
    page.on("request", (request) => requests.push(request));

    await page.goto("/?free=1");
    await exportPdf(page, emojiChat());

    // The emoji artwork is fetched as one bundle for exactly this reason: a
    // request per emoji would spell out the chat's contents in an access log.
    const emojiRequests = requests.filter((request) =>
      request.url().includes("twemoji")
    );
    expect(emojiRequests).toHaveLength(1);
    expect(new URL(emojiRequests[0].url()).origin).toBe(
      new URL(page.url()).origin
    );

    const leaked = requests.filter((request) => {
      const body = request.postData() || "";
      return body.includes("Grüße") || body.includes("filler 42");
    });
    expect(leaked).toEqual([]);
  });

  test("draws image attachments from a zip export", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/?free=1");

    const pdf = await exportPdf(page, await zipChatWithImage());
    const raw = pdf.toString("latin1");

    // Look for the attachment's own dimensions rather than just "an image":
    // the charts are images too, so a dropped attachment would go unnoticed.
    // Finding a 24x24 XObject means the zip entry was located, inflated,
    // decoded and placed — each a step that has lost attachments before.
    expect(raw).toMatch(/\/Width 24[\s/]/);
    expect(raw).toMatch(/\/Height 24[\s/]/);
  });
});
