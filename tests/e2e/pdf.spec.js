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
    ].join("\n"),
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
      `1/${2 + index}/21, ${9 + (index % 10)}:15 - ${author}: ${text}`,
    );
  });
  // Enough messages to run onto a second page, so pagination is exercised too.
  for (let i = 0; i < 60; i++) {
    lines.push(
      `2/${1 + (i % 27)}/21, ${9 + (i % 10)}:15 - Jane Doe: filler ${i} 🎉`,
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
  return await downloadPreview(page);
};

/** Clicks the free preview button and reads the PDF it produces. */
const downloadPreview = async (page) => {
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
      request.url().includes("twemoji"),
    );
    expect(emojiRequests).toHaveLength(1);
    expect(new URL(emojiRequests[0].url()).origin).toBe(
      new URL(page.url()).origin,
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

test.describe("the court evidence PDF", () => {
  /** Uploads on the court page and hands back the transcript's bytes. */
  const exportCourtPdf = async (page, file) => {
    // `free` asks for the whole chat rather than the 100-message sample.
    await page.goto("/tools/court-evidence?free=1");
    await page.locator("#dropzone-slot input[type=file]").setInputFiles(file);
    return await downloadPreview(page);
  };

  test("is printed from HTML like the visual export, text and all", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const pdf = await exportCourtPdf(page, emojiChat());
    const raw = pdf.toString("latin1");

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(raw).toContain("FontFile2");
    expect(contentStreams(pdf).match(/Tj/g)?.length ?? 0).toBeGreaterThan(300);

    // Cover, transcript, monthly counts and the signature page each start a
    // sheet of their own.
    expect(raw.match(/\/Type \/Page\b/g)?.length ?? 0).toBeGreaterThanOrEqual(
      4,
    );

    // Emoji in the transcript are artwork here too, instead of tofu.
    expect(raw.match(/\/Subtype \/Image/g)?.length ?? 0).toBeGreaterThan(10);
  });

  test("reproduces image exhibits from a zip export", async ({ page }) => {
    test.setTimeout(180_000);
    const pdf = await exportCourtPdf(page, await zipChatWithImage());
    const raw = pdf.toString("latin1");

    // The court transcript has no charts, so this image can only be the
    // exhibit reproduced in annex A.
    expect(raw).toMatch(/\/Width 24[\s/]/);
    expect(raw).toMatch(/\/Height 24[\s/]/);
  });
});

test.describe("the WhatsApp to PDF tool", () => {
  const openTool = async (page, file = emojiChat()) => {
    await page.goto("/whatsapp-to-pdf?free=1");
    await page.locator("#dropzone-slot input[type=file]").setInputFiles(file);
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
  };

  /** The preview's wallpaper, read inside its shadow root. */
  const previewBackground = (page) =>
    page
      .locator(".chat-preview .cv-root")
      .evaluate((root) => getComputedStyle(root).backgroundColor);

  test("previews the chat in the chosen style @mobile", async ({ page }) => {
    await openTool(page);

    // Playwright's CSS locators reach into the open shadow root.
    const bubbles = page.locator(".chat-preview .cv-msg");
    await expect(bubbles.first()).toBeVisible();
    expect(await bubbles.count()).toBeGreaterThan(20);
    await expect(
      page.locator(".chat-preview .cv-msg.is-out").first(),
    ).toBeVisible();

    expect(await previewBackground(page)).toBe("rgb(239, 234, 226)");
    await page.locator('label:has([data-style="android-dark"])').click();
    expect(await previewBackground(page)).toBe("rgb(11, 20, 26)");

    // Times off: the bubbles lose their time line.
    await expect(page.locator(".chat-preview .cv-time").first()).toBeVisible();
    await page.getByLabel("Show times").uncheck();
    await expect(page.locator(".chat-preview .cv-time")).toHaveCount(0);

    // The look is remembered, so a buyer back from checkout gets it.
    await page.reload();
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
    expect(await previewBackground(page)).toBe("rgb(11, 20, 26)");
  });

  test("downloads the PDF in the chosen style", async ({ page }) => {
    test.setTimeout(180_000);
    await openTool(page);
    await page.locator('label:has([data-style="android-dark"])').click();

    const pdf = await downloadPreview(page);
    const raw = pdf.toString("latin1");
    const streams = contentStreams(pdf);

    expect(raw).toContain("FontFile2");
    expect(streams.match(/Tj/g)?.length ?? 0).toBeGreaterThan(100);
    // Every page is filled with the style's wallpaper, #0b141a (jsPDF
    // writes colours to two decimals).
    expect(streams).toContain("0.04 0.08 0.1 rg");
    // Emoji are artwork here too.
    expect(raw.match(/\/Subtype \/Image/g)?.length ?? 0).toBeGreaterThan(10);
  });

  test("prints only the chat with the browser's print dialog", async ({
    page,
  }) => {
    // window.print() would block a headed browser; record it instead and
    // play the events a real print dialog fires around it.
    await page.addInitScript(() => {
      window.print = () => {
        window.__printed = (window.__printed || 0) + 1;
        window.dispatchEvent(new Event("beforeprint"));
      };
    });
    await openTool(page);
    await page.emulateMedia({ media: "print" });

    await page.getByRole("button", { name: "Print", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__printed)).toBe(1);

    // Only the chat is on paper: the site around it is not.
    await expect(page.locator("html")).toHaveClass(/cv-printing/);
    await expect(page.locator("#cv-print-root .cv-msg").first()).toBeVisible();
    // A second beforeprint for the same print must not add a second copy.
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(page.locator("#cv-print-root")).toHaveCount(1);
    await expect(page.locator("#chat-pdf-tool")).toBeHidden();
    await expect(page.locator("footer").first()).toBeHidden();

    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await expect(page.locator("#cv-print-root")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/cv-printing/);
  });
});
