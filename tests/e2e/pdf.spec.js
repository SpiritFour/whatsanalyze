/**
 * The PDF export. These assertions are about the two properties the export
 * exists for and that are easy to lose silently in a refactor: the text is real
 * text rather than a picture of text, and emoji are colour artwork.
 */
const fs = require("node:fs/promises");
const zlib = require("node:zlib");
const JSZip = require("jszip");
const {
  activeSubscription,
  analyzeChat,
  expect,
  stubCallable,
  test,
} = require("./fixtures");

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
    // emoji are images too, so a dropped attachment would go unnoticed.
    // Finding a 24x24 XObject means the zip entry was located, inflated,
    // decoded and placed — each a step that has lost attachments before.
    expect(raw).toMatch(/\/Width 24[\s/]/);
    expect(raw).toMatch(/\/Height 24[\s/]/);
  });
});

test.describe("the analyzer's PDF", () => {
  const pages = (pdf) =>
    pdf.toString("latin1").match(/\/Type \/Page\b/g)?.length ?? 0;

  test("is the WhatsApp to PDF tool's document, in its default look", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto("/?free=1");
    const pdf = await exportPdf(page, emojiChat());
    const raw = pdf.toString("latin1");
    // The tool's cover, with its link back to the tool.
    expect(raw).toMatch(/\/URI \([^)]*whatsapp-to-pdf[^)]*utm_campaign=cover/);
    // Cover, the analysis pages, then the chat (68 messages: two pages or
    // more).
    expect(pages(pdf)).toBeGreaterThanOrEqual(5);
    // The analysis page's charts are in it, as pictures: JPEG images, which
    // this chat has nowhere else.
    expect(raw.match(/\/DCTDecode/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
  });

  test("prints like the tool does", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/?free=1");
    await analyzeChat(page, emojiChat());
    // The same buttons, in the same order, as in the tool.
    await expect(page.locator("[data-pdf-print]")).toBeVisible();
    await page.locator("[data-pdf-print]").click();
    await expect(page.locator("#pdf-print-frame")).toHaveCount(1, {
      timeout: 60_000,
    });
  });

  test("leads to the tool with the chat, for another look", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await analyzeChat(page, emojiChat());
    await page.locator("[data-pdf-customize] a").click();
    await expect(page).toHaveURL(/\/tools\/whatsapp-to-pdf/);
    // No second upload: the chat came along.
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
    await expect(
      page.locator(".chat-preview .cv-bubble").first(),
    ).toBeVisible();
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

  test("is printed on US Letter when chosen", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/tools/court-evidence?free=1");
    await page
      .locator("#dropzone-slot input[type=file]")
      .setInputFiles(emojiChat());
    await page
      .locator('label:has(input[name="court-paper"][value="letter"])')
      .click();
    const pdf = (await downloadPreview(page)).toString("latin1");
    expect(pdf).toMatch(/\/MediaBox \[0 0 612(\.\d*)? 792(\.\d*)?\]/);
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
    await page.goto("/tools/whatsapp-to-pdf?free=1");
    await page.locator("#dropzone-slot input[type=file]").setInputFiles(file);
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
  };

  /** The controls come in three tabs: look, design and content. */
  const openControls = (page, tab) =>
    page.locator(`[data-controls="${tab}"]`).click();

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

    // Polled: the preview redraws on the next tick after a change.
    await expect.poll(() => previewBackground(page)).toBe("rgb(239, 234, 226)");
    await page.locator('label:has([data-style="android-dark"])').click();
    await expect.poll(() => previewBackground(page)).toBe("rgb(11, 20, 26)");

    // Times off: the bubbles lose their time line.
    await expect(page.locator(".chat-preview .cv-time").first()).toBeVisible();
    await openControls(page, "content");
    await page.getByLabel("Show times").uncheck();
    await expect(page.locator(".chat-preview .cv-time")).toHaveCount(0);

    // The look is remembered, so a buyer back from checkout gets it.
    await page.reload();
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
    await expect.poll(() => previewBackground(page)).toBe("rgb(11, 20, 26)");
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

  test("puts a cover first and, on a preview, an outro with the rest", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    // Longer than the 100-message preview, so the preview leaves 50 out.
    const lines = ["1/2/21, 09:00 - John Doe: hi"];
    for (let i = 1; i < 150; i++) {
      lines.push(
        `1/${2 + (i % 27)}/21, 10:${String(i % 60).padStart(2, "0")} - ${
          i % 2 ? "Jane Doe" : "John Doe"
        }: message ${i}`,
      );
    }
    const chat = {
      name: "long_chat.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(lines.join("\n"), "utf-8"),
    };

    const links = (pdf) =>
      [...pdf.toString("latin1").matchAll(/\/URI \(([^)]*)\)/g)].map(
        (match) => match[1],
      );

    // The free preview: cover, 100 messages, then the outro.
    await page.goto("/tools/whatsapp-to-pdf");
    await page.locator("#dropzone-slot input[type=file]").setInputFiles(chat);
    const preview = links(await downloadPreview(page));
    expect(preview).toContainEqual(
      expect.stringMatching(/\/tools\/whatsapp-to-pdf\/\?.*utm_campaign=cover/),
    );
    expect(preview).toContainEqual(
      expect.stringMatching(
        /\/tools\/whatsapp-to-pdf\/\?.*utm_campaign=preview_outro/,
      ),
    );
    expect(preview).toContainEqual(
      expect.stringMatching(/\/tools\/court-evidence\/\?utm_source=chat_pdf/),
    );

    // The whole chat: the cover, but nothing to sell.
    await page.goto("/tools/whatsapp-to-pdf?free=1");
    await page.locator("#dropzone-slot input[type=file]").setInputFiles(chat);
    const full = links(await downloadPreview(page));
    expect(full).toContainEqual(expect.stringMatching(/utm_campaign=cover/));
    expect(full.filter((url) => url.includes("preview_outro"))).toEqual([]);
  });

  test("prints the PDF itself from the Print button", async ({ page }) => {
    test.setTimeout(180_000);
    await openTool(page);

    const print = page.locator("[data-pdf-print]");
    await print.click();
    // While the PDF is made, the button says so, the status line says which
    // step it is on, and the other buttons wait.
    await expect(print).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("[data-pdf-status]")).toBeVisible();
    await expect(page.locator("[data-pdf-sample]")).toBeDisabled();

    // The same file the download gives, handed to the browser's PDF printing
    // in a frame: it looks the same from every browser.
    const frame = page.locator("#pdf-print-frame");
    await expect(frame).toHaveCount(1, { timeout: 60_000 });
    expect(await frame.getAttribute("src")).toMatch(/^blob:/);
    await expect(
      page.getByRole("button", { name: "Print", exact: true }),
    ).toBeEnabled();
  });

  test.describe("on an iPhone", () => {
    test.use({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    });

    test("makes the PDF first, then opens it on a second tap", async ({
      page,
    }) => {
      test.setTimeout(180_000);
      await openTool(page);
      const print = page.locator("[data-pdf-print]");
      await print.click();
      // No blank tab while the PDF is made: the tap only prepares it.
      await expect(print).toHaveText("Open PDF to print", { timeout: 60_000 });

      // The second tap is a fresh one, so the PDF opens straight away (here
      // in a tab: this browser has no share sheet for files). Headless
      // Chromium shows no URL for a PDF tab, so the call itself is checked.
      await page.evaluate(() => {
        window.__opened = [];
        window.open = (url) => {
          window.__opened.push(String(url));
          return null;
        };
      });
      await print.click();
      await expect
        .poll(() => page.evaluate(() => window.__opened))
        .toEqual([expect.stringMatching(/^blob:/)]);

      // A change to the design makes it stale: the next tap prepares anew.
      await openControls(page, "content");
      await page.locator('input[name="chat-analysis"]').uncheck();
      await expect(print).toHaveText("Print");
    });
  });

  test("prints only the chat with the browser's own print", async ({
    page,
  }) => {
    await openTool(page);
    await page.emulateMedia({ media: "print" });

    // Ctrl+P, or Share > Print on a phone: the browser fires beforeprint.
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));

    // Only the chat is on paper: the site around it is not.
    await expect(page.locator("html")).toHaveClass(/cv-printing/);
    await expect(page.locator("#cv-print-root .cv-msg").first()).toBeVisible();
    await expect(page.locator("#chat-pdf-tool")).toBeHidden();
    await expect(page.locator("footer").first()).toBeHidden();
    // A second beforeprint for the same print must not add a second copy.
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(page.locator("#cv-print-root")).toHaveCount(1);

    // Engines with named pages print on the `chat` page; the padded fallback
    // for engines without them (Safari) must not apply here as well.
    const padding = await page
      .locator("#cv-print-root")
      .evaluate((root) => getComputedStyle(root).paddingTop);
    expect(padding).toBe("0px");

    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await expect(page.locator("#cv-print-root")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/cv-printing/);
  });

  test("prints on the chosen paper, and only the chosen messages", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await openTool(page);

    const bubbles = page.locator(".chat-preview .cv-msg");
    const all = await bubbles.count();
    await expect(page.locator(".chat-preview .cv-system")).not.toHaveCount(0);

    // WhatsApp's own notices can go...
    await openControls(page, "content");
    await page.getByLabel("Hide WhatsApp notices").check();
    await expect(page.locator(".chat-preview .cv-system")).toHaveCount(0);

    // ...and so can every day outside a range: the emoji chat's second
    // month only.
    await page.locator('input[name="chat-from"]').fill("2021-02-01");
    await expect.poll(() => bubbles.count()).toBeLessThan(all);
    await expect(
      page.locator(".chat-preview .cv-day-label").first(),
    ).toContainText("February");

    // US Letter: 8.5 x 11 in, 612 x 792 pt.
    await openControls(page, "look");
    await page
      .locator('label:has(input[name="chat-paper"][value="letter"])')
      .click();
    const pdf = (await downloadPreview(page)).toString("latin1");
    // jsPDF writes the width as 612.0000000000001137.
    expect(pdf).toMatch(/\/MediaBox \[0 0 612(\.\d*)? 792(\.\d*)?\]/);
  });

  test("offers only the fonts that have every letter of the chat", async ({
    page,
  }) => {
    const chatIn = (name, lines) => ({
      name,
      mimeType: "text/plain",
      buffer: Buffer.from(
        lines
          .map(
            (text, i) =>
              `1/${2 + i}/21, 10:0${i} - ${i % 2 ? "Anna" : "Boris"}: ${text}`,
          )
          .join("\n"),
        "utf-8",
      ),
    });
    const fontChips = page.locator("[data-font]");

    // Russian: the typewriter has no Cyrillic, the other two do.
    await page.goto("/tools/whatsapp-to-pdf");
    await page
      .locator("#dropzone-slot input[type=file]")
      .setInputFiles(chatIn("russian.txt", ["Привет!", "Как дела? 😂"]));
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
    await openControls(page, "design");
    await expect(page.locator('[data-font="serif"]')).toHaveCount(1);
    await expect(page.locator('[data-font="typewriter"]')).toHaveCount(0);
    await expect(page.locator("[data-fonts-hidden]")).toBeVisible();

    // A book font chosen for that chat...
    await page.locator('label:has([data-font="serif"])').click();

    // ...does not carry over to an Arabic one, which none of them can draw.
    await page.goto("/tools/whatsapp-to-pdf");
    await page
      .locator("#dropzone-slot input[type=file]")
      .setInputFiles(chatIn("arabic.txt", ["مرحبا", "كيف حالك"]));
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
    await openControls(page, "design");
    await expect(fontChips).toHaveCount(1);
    await expect(page.locator('[data-font="default"]')).toBeChecked();
  });

  test("says so when the chosen days have no messages", async ({ page }) => {
    await openTool(page);
    await openControls(page, "content");
    // The emoji chat has nothing in March.
    await page.locator('input[name="chat-from"]').fill("2021-03-01");
    await page.locator('input[name="chat-to"]').fill("2021-03-31");

    await expect(page.locator("[data-empty]")).toBeVisible();
    // Nothing to print or download: the buttons go with the download section.
    await expect(
      page.getByRole("button", { name: "Print", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Download free preview PDF/i }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "All days" }).click();
    await expect(page.locator("[data-empty]")).toHaveCount(0);
    await expect(page.locator(".chat-preview .cv-msg").first()).toBeVisible();
  });

  test("downloads no font until the design tab is opened", async ({ page }) => {
    const fonts = [];
    page.on("request", (request) => {
      if (/\.ttf(\?|$)/.test(request.url())) fonts.push(request.url());
    });
    await openTool(page);
    await expect(page.locator(".chat-preview .cv-msg").first()).toBeVisible();
    expect(fonts).toEqual([]);

    await openControls(page, "design");
    await expect.poll(() => fonts.length).toBeGreaterThan(0);
  });

  /** A chat by these people, one message each, nothing else. */
  const chatBy = (name, people, text = (i) => `hello ${i}`) => ({
    name,
    mimeType: "text/plain",
    buffer: Buffer.from(
      people
        .map(
          (person, i) => `1/${2 + i}/21, 10:0${i % 10} - ${person}: ${text(i)}`,
        )
        .join("\n"),
      "utf-8",
    ),
  });

  test("shows a circle for every group member, then +N", async ({ page }) => {
    await page.goto("/tools/whatsapp-to-pdf");
    // Seven people: the one on the right and six others.
    const people = ["Ana", "Ben", "Cleo", "Dan", "Eve", "Finn", "Gus"];
    await page
      .locator("#dropzone-slot input[type=file]")
      .setInputFiles(chatBy("group.txt", [...people, "Ana", "Ana"]));
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();

    const circles = page.locator(".chat-preview .cv-header .cv-avatar");
    await expect(circles).toHaveCount(5);
    await expect(circles.last()).toHaveText("+2");
  });

  test("draws a voice message like WhatsApp, with its length", async ({
    page,
  }) => {
    // A minimal Ogg Opus file: its last page says 3.2 s (48 kHz, 312
    // samples pre-skip), which is all the length is read from.
    const page_ = (granule, payload, seq, flags = 0) => {
      const header = Buffer.alloc(27);
      header.write("OggS", 0, "latin1");
      header[5] = flags;
      header.writeBigInt64LE(BigInt(granule), 6);
      header.writeUInt32LE(seq, 18);
      header[26] = 1;
      return Buffer.concat([header, Buffer.from([payload.length]), payload]);
    };
    const head = Buffer.alloc(19);
    head.write("OpusHead", 0, "latin1");
    head[8] = 1;
    head[9] = 1;
    head.writeUInt16LE(312, 10);
    head.writeUInt32LE(48000, 12);
    const opus = Buffer.concat([
      page_(0, head, 0, 2),
      page_(Math.round(48000 * 3.2) + 312, Buffer.alloc(40), 1, 4),
    ]);
    const zip = new JSZip();
    zip.file(
      "_chat.txt",
      [
        "[28.11.26, 15:18:02] Tom Weber: Hast du kurz Zeit?",
        "[28.11.26, 15:20:54] Mara Brandl: \u200e<Anhang: 00000008-AUDIO-2026-11-28-15-20-54.opus>",
      ].join("\n"),
    );
    zip.file("00000008-AUDIO-2026-11-28-15-20-54.opus", opus);

    await openTool(page, {
      name: "voice.zip",
      mimeType: "application/zip",
      buffer: await zip.generateAsync({ type: "nodebuffer" }),
    });
    const voice = page.locator(".chat-preview .cv-voice");
    await expect(voice).toHaveCount(1);
    await expect(voice.locator(".cv-voice-meta")).toContainText("0:03");
    // The file name is not printed as text any more.
    await expect(page.locator(".chat-preview")).not.toContainText("Anhang");
  });

  test("asks for the point of view above the settings", async ({ page }) => {
    await openTool(page);
    // Visible whichever settings tab is open.
    for (const tab of ["look", "design", "content"]) {
      await openControls(page, tab);
      await expect(page.locator('select[name="chat-me"]')).toBeVisible();
    }
    await expect(page.getByText("Point of view")).toBeVisible();
  });

  test("prints the analysis pages unless turned off", async ({ page }) => {
    test.setTimeout(180_000);
    await openTool(page);
    const pageCount = (pdf) =>
      pdf.toString("latin1").match(/\/Type \/Page\b/g)?.length ?? 0;
    const withAnalysis = pageCount(await downloadPreview(page));

    await openControls(page, "content");
    await page.locator('input[name="chat-analysis"]').uncheck();
    // The analysis page's cards take a few pages of their own.
    expect(pageCount(await downloadPreview(page))).toBeLessThan(
      withAnalysis - 1,
    );
  });

  test("puts everyone on the cover as a circle, unless turned off", async ({
    page,
  }) => {
    await page.goto("/tools/whatsapp-to-pdf");
    const people = ["Ana", "Ben Bell", "Cleo"];
    await page
      .locator("#dropzone-slot input[type=file]")
      .setInputFiles(chatBy("trio.txt", [...people, "Ana"]));
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();

    await page.locator('[data-tab="cover"]').click();
    const faces = page.locator(".cover-preview .cp-face");
    // Everyone, the person on the right included, by their initials.
    await expect(faces).toHaveText(["A", "BB", "C"]);

    await openControls(page, "design");
    await page.locator("summary", { hasText: "Cover" }).click();
    await page.locator('input[name="chat-cover-faces"]').uncheck();
    await expect(faces).toHaveCount(0);
  });

  test("draws emoji in names as artwork, like in messages", async ({
    page,
  }) => {
    await page.goto("/tools/whatsapp-to-pdf");
    await page
      .locator("#dropzone-slot input[type=file]")
      .setInputFiles(chatBy("names.txt", ["Leo", "Mom ❤️", "Leo"]));
    await expect(page.locator("#chat-pdf-tool")).toBeVisible();
    // Leo writes most, so the chat is titled after Mom: heart as an image.
    await expect(
      page.locator(".chat-preview .cv-title img.wa-emoji"),
    ).toBeVisible();

    // On the cover preview too, at the size of the text around it (it was
    // once drawn at the artwork's full size there).
    await page.locator('[data-tab="cover"]').click();
    const heart = page.locator(".cover-preview .cp-members img.wa-emoji");
    await expect(heart).toBeVisible();
    expect((await heart.boundingBox()).height).toBeLessThan(30);
  });

  test("moves between the settings tabs with the arrow keys", async ({
    page,
  }) => {
    await openTool(page);
    const look = page.locator('[data-controls="look"]');
    await look.focus();
    await page.keyboard.press("ArrowRight");
    const design = page.locator('[data-controls="design"]');
    await expect(design).toHaveAttribute("aria-selected", "true");
    await expect(design).toBeFocused();
    await expect(page.locator("#cv-panel-design")).toBeVisible();
    await page.keyboard.press("End");
    await expect(page.locator('[data-controls="content"]')).toBeFocused();
  });

  test.describe("Pro designs", () => {
    /** Custom colours, a hearts wallpaper and a titled cover. */
    const designIt = async (page) => {
      await page.locator('label:has([data-style="custom"])').click();
      await openControls(page, "design");
      await page.locator('input[name="chat-color-page"]').fill("#123456");
      // Both sit in panels that open on demand, as a visitor would open them.
      await page.locator("summary", { hasText: "Background" }).click();
      await page.locator('label:has([data-background="hearts"])').click();
      await page.locator("summary", { hasText: "Cover" }).click();
      await page.locator('input[name="chat-cover-title"]').fill("Our story");
    };

    /** JPEG images in the PDF: here only a wallpaper can be one. */
    const jpegCount = (pdf) =>
      pdf.toString("latin1").match(/\/DCTDecode/g)?.length ?? 0;

    /** The analysis pages' charts are JPEGs too: out of these counts. */
    const withoutAnalysis = async (page) => {
      await openControls(page, "content");
      await page.locator('input[name="chat-analysis"]').uncheck();
    };

    test("can be tried by anyone, but stay out of the free PDF", async ({
      page,
    }) => {
      test.setTimeout(180_000);
      await openTool(page);
      await designIt(page);

      // The preview shows the whole design...
      await expect.poll(() => previewBackground(page)).toBe("rgb(18, 52, 86)");
      await expect
        .poll(() =>
          page
            .locator(".chat-preview .cv-root")
            .evaluate((root) => root.style.backgroundImage),
        )
        .toContain("data:image/jpeg");
      await page.locator('[data-tab="cover"]').click();
      await expect(page.locator(".cover-preview .cp-title")).toHaveText(
        "Our story",
      );
      // ...and says what it takes to print it, in the design panel and
      // again where the PDF is downloaded.
      await expect(page.locator(".design__note")).toBeVisible();
      await expect(page.locator("[data-pro-download-note]")).toBeVisible();

      await withoutAnalysis(page);
      const pdf = await downloadPreview(page);
      const streams = contentStreams(pdf);
      expect(streams).not.toContain("0.07 0.2 0.34 rg");
      expect(jpegCount(pdf)).toBe(0);
    });

    /** A Pro preset and a Pro font. */
    const pickMidnightSerif = async (page) => {
      await page.locator('label:has([data-style="midnight"])').click();
      await openControls(page, "design");
      await page.locator('label:has([data-font="serif"])').click();
    };
    // #0f172a as jsPDF writes it, and the book font (Lora) as embedded:
    // jsPDF names it after its family.
    const MIDNIGHT = "0.06 0.09 0.16 rg";
    const hasLora = (pdf) =>
      pdf.toString("latin1").includes("/BaseFont /WaSerif");

    test("keep Pro presets and fonts out of the free PDF", async ({ page }) => {
      test.setTimeout(180_000);
      await openTool(page);
      await pickMidnightSerif(page);
      // Tried on screen: the preview is in midnight.
      await expect.poll(() => previewBackground(page)).toBe("rgb(15, 23, 42)");

      const pdf = await downloadPreview(page);
      expect(contentStreams(pdf)).not.toContain(MIDNIGHT);
      expect(hasLora(pdf)).toBe(false);
    });

    test("show profile pictures in the preview, not in the free PDF", async ({
      page,
    }) => {
      test.setTimeout(180_000);
      await openTool(page);
      await openControls(page, "design");
      await page.locator("summary", { hasText: "Profile pictures" }).click();
      // Jane writes most and is on the right; the header shows John.
      await page.locator('input[name="chat-avatar-John Doe"]').setInputFiles({
        name: "john.png",
        mimeType: "image/png",
        buffer: Buffer.from(PNG_BASE64, "base64"),
      });
      await expect(
        page.locator(".chat-preview .cv-header img.cv-avatar.is-photo"),
      ).toHaveCount(1);

      await withoutAnalysis(page);
      const pdf = await downloadPreview(page);
      // The picture is a JPEG once cropped: none in the free PDF.
      expect(jpegCount(pdf)).toBe(0);
    });

    test("are printed for subscribers", async ({ page }) => {
      test.setTimeout(180_000);
      await stubCallable(page, "verifySubscription", activeSubscription());
      await page.goto("/subscribe?email=test@example.com&token=sub_test123");
      await expect(
        page.getByRole("heading", { name: /your subscription is active/i }),
      ).toBeVisible();

      await openTool(page);
      await designIt(page);
      await expect(page.locator(".design__note")).toHaveCount(0);
      await expect(page.locator("[data-pro-download-note]")).toHaveCount(0);

      // Subscribers get the whole chat, from their own button.
      await withoutAnalysis(page);
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download now" }).click();
      const pdf = await fs.readFile(await (await downloadPromise).path());
      // The page colour fills every chat page, and the wallpaper is in the
      // file once however many pages show it.
      expect(contentStreams(pdf)).toContain("0.07 0.2 0.34 rg");
      expect(jpegCount(pdf)).toBe(1);
    });

    test("print Pro presets and fonts for subscribers", async ({ page }) => {
      test.setTimeout(180_000);
      await stubCallable(page, "verifySubscription", activeSubscription());
      await page.goto("/subscribe?email=test@example.com&token=sub_test123");
      await expect(
        page.getByRole("heading", { name: /your subscription is active/i }),
      ).toBeVisible();

      await openTool(page);
      await pickMidnightSerif(page);
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download now" }).click();
      const pdf = await fs.readFile(await (await downloadPromise).path());

      expect(contentStreams(pdf)).toContain(MIDNIGHT);
      // The font the preview used is the one embedded: same file, same widths.
      expect(hasLora(pdf)).toBe(true);
    });
  });
});
