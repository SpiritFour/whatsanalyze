/**
 * The pages around the payment flows. Not deep tests — they are here so a
 * change somewhere else cannot quietly take a page down without anyone
 * noticing, and every one of them also fails on an uncaught runtime error.
 */
const {
  analyzeChat,
  EXAMPLE_CHAT,
  expect,
  expectAnalysis,
  test,
  zipExport,
} = require("./fixtures");

test.describe("the analyzer", () => {
  test("renders the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/WhatsAnalyze/);
    await expect(
      page.getByText("Analyze your WhatsApp Chat in Seconds", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("#uploadmytextfile")).toBeAttached();
  });

  test("analyzes a chat without sending its contents anywhere", async ({
    page,
  }) => {
    const requests = [];
    page.on("request", (request) => requests.push(request));

    await page.goto("/");
    await analyzeChat(page);
    await expect(
      page.getByText("Messages per Day", { exact: true }),
    ).toBeVisible();

    // The whole promise of the product: the chat is analyzed in the browser.
    const leaked = requests.filter((request) => {
      const body = request.postData() || "";
      return body.includes("Jane Doe") || body.includes("John Doe");
    });
    expect(leaked).toEqual([]);
  });

  // A .zip is what WhatsApp produces whenever the export includes media, so
  // it is at least as common as the .txt every other test here uses — and it
  // goes down a different branch of the parser, which nothing covered.
  for (const shape of ["ios", "android"]) {
    test(`analyzes a ${shape}-shaped zip export`, async ({ page }) => {
      await page.goto("/");
      await page
        .locator("#uploadmytextfile")
        .setInputFiles(await zipExport(shape));
      await expectAnalysis(page);
      await expect(
        page.getByText("Messages per Day", { exact: true }),
      ).toBeVisible();
    });
  }

  // The PDF worker gets attachments over postMessage, which drops anything
  // that isn't plain data — a JSZip entry's `.async()` lives on its
  // prototype, so a naive structured clone silently breaks the PDF for any
  // chat with media in its zip.
  test("builds the free preview PDF for a zip export with a stored attachment", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#uploadmytextfile").setInputFiles(await zipExport());
    await expectAnalysis(page);

    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /Download free preview PDF/i })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  // The three below cover the results-page QA round (#411). Nothing failed
  // these when they were filed, because nothing was watching those numbers.
  test("takes the visitor to the analysis it just built", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);

    // The results start some 700px below the hero. Leaving the visitor up
    // there made a successful upload look like it had only printed "Done!".
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBeGreaterThan(300);
  });

  test("counts the same messages everywhere it shows a count", async ({
    page,
  }) => {
    await page.goto("/");
    await analyzeChat(page);

    // 536 messages from two people, plus the encryption notice nobody sent.
    // The stat card used to count the notice and call the total "You have
    // sent", while the doughnut beside it left it out — 537 against 535.
    await expect(page.getByText("Messages in total")).toBeVisible();
    await expect(
      page.locator("#download-graphs").getByText("536", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("#download-graphs").getByText("540", { exact: true }),
    ).toBeVisible();

    // The same file, counted again by a tool that reached it another way.
    await page.goto("/tools/message-counter");
    await page.locator('input[type="file"]').setInputFiles(EXAMPLE_CHAT);
    await expect(page.getByText(/536 messages/)).toBeVisible();
    await expect(page.getByText(/540 total days/)).toBeVisible();
  });

  test("names the thing each chart counts", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);

    // These four used to read "Messages per" and stop, the noun having ended
    // up in the card title instead.
    for (const subtitle of [
      "Messages per Person",
      "Messages per Hour",
      "Messages per Month",
      "Messages per Weekday",
    ]) {
      await expect(page.getByText(subtitle, { exact: true })).toBeVisible();
    }
  });

  test("builds the free preview PDF in the browser", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);

    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /Download free preview PDF/i })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test("opens the download section when linked straight to it", async ({
    page,
  }) => {
    // "Open Chat Analyzer" on the subscribe page sends subscribers here for
    // their download, not for the hero.
    await page.goto("/");
    await analyzeChat(page);

    await page.goto("/#payButton");
    await expect(page.locator("#payButton")).toBeInViewport();
  });

  test("switches to a localized route", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Select language").selectOption("de");

    await expect(page).toHaveURL(/\/de\/?$/);
    await expect(
      page.getByText("Analysiere dein WhatsApp Chat in Sekunden", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("renders migrated markdown content", async ({ page }) => {
    await page.goto("/how-to-export-your-whatsapp-chat");

    await expect(page).toHaveTitle(/How to Export your WhatsApp Chat/);
    // By role, not by text: the page title is also the last breadcrumb now, so
    // a plain text match finds two nodes.
    await expect(
      page.getByRole("heading", {
        name: "Export WhatsApp Chat: The Ultimate Guide",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Option 1: iPhone (iOS) - Export as a .txt File",
      }),
    ).toBeVisible();
  });
});

test.describe("wrapped", () => {
  test("renders the landing page", async ({ page }) => {
    await page.goto("/wrapped");

    await expect(page).toHaveTitle(/WhatsApp Wrapped/);
    await expect(page.locator("label[for='dropzone-file']")).toBeVisible();
    await expect(
      page.getByText("Your Chat, Told Like a Story", { exact: false }),
    ).toBeVisible();
  });

  test("renders the story carousel on /wrapped/results", async ({ page }) => {
    await page.goto("/wrapped/results");
    await expect(page.locator(".wrapped-scope")).toBeVisible();
  });

  test("is reachable from the home page banner", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a[href='/wrapped']").first()).toBeVisible();
  });
});

test.describe("tools and footer", () => {
  const TOOL_PATHS = [
    "/tools/court-evidence",
    "/tools/proof-of-relationship",
    "/tools/inactivity",
    "/tools/message-counter",
    "/tools/word-counter",
    "/tools/chat-heatmap",
  ];

  test("no longer links to the retired year review page", async ({ page }) => {
    // It was replaced by /wrapped and only ever reached an error page. Hosting
    // redirects the old URL for the copies Google still has.
    await page.goto("/");
    await page.waitForSelector(".site-footer");

    await expect(
      page.locator(".site-footer a[href*='whatsapp-wrapped-year-review']"),
    ).toHaveCount(0);
    await expect(page.locator(".site-footer a[href='/wrapped']")).toHaveCount(
      1,
    );
  });

  test("gives every footer link somewhere to go", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".site-footer");

    const links = await page.locator(".site-footer a").all();
    expect(links.length).toBeGreaterThanOrEqual(10);

    for (const link of links) {
      const href = await link.getAttribute("href");
      const text = (await link.innerText()).trim();
      expect(href, `Link "${text}" must have a non-null href`).not.toBeNull();
      expect(href, `Link "${text}" must not have an empty href`).not.toBe("");
    }
  });

  test("serves every tool page", async ({ page }) => {
    for (const toolPath of TOOL_PATHS) {
      const response = await page.goto(toolPath);
      expect(response?.status(), `${toolPath} must be served`).toBe(200);
      await expect(page.locator(".landing-hero__title")).toBeVisible();
    }
  });

  test("shows two separated groups and all 6 tools in the directory", async ({
    page,
  }) => {
    await page.goto("/tools");
    await page.waitForSelector(".tools-directory");

    const groups = page.locator(".tools-group");
    await expect(groups).toHaveCount(2);
    // Chat Analytics
    await expect(groups.nth(0).locator(".tool-card")).toHaveCount(4);
    // Court Documentation
    const courtCards = groups.nth(1).locator(".tool-card");
    await expect(courtCards).toHaveCount(2);
    await expect(
      courtCards.first().locator(".tool-card__court-badge"),
    ).toHaveText("PDF");
  });

  test("takes a tool's CTA straight to the full results", async ({ page }) => {
    await page.goto("/tools/inactivity");
    await page.waitForSelector(".btn-ghost");

    // Analyze the sample chat the tool offers.
    await page.locator(".btn-ghost").click();
    await expect(page.locator(".hero-metric-card")).toBeVisible();

    const cta = page.locator(".hook-actions a");
    await expect(cta).toBeVisible();
    await cta.click();

    await page.waitForURL(/.*#results/);
    await expect(page.locator("#results")).toBeVisible();
    await expect(
      page.getByText("Chat Timeline", { exact: true }),
    ).toBeVisible();
    // The upload hero stays on the page, so another chat can be dropped in
    // without leaving the results.
    await expect(page.locator("#dropzone-slot")).toBeAttached();
  });

  test("navigates from the header links", async ({ page }) => {
    await page.goto("/");

    // The support links share the class, so the products are only the ones in
    // the bar that carries the label.
    const nav = page.locator(".site-header__nav[aria-label='Products']");
    // The two products you are not in, as plain links rather than a dropdown.
    await expect(nav.locator("a")).toHaveCount(2);
    await expect(page.locator(".site-header__dropdown")).toHaveCount(0);
    // A "start the analyzer" button on the analyzer itself is not a call to
    // action — the homepage header has none.
    await expect(page.locator(".site-header__cta")).toHaveCount(0);

    await nav.locator("a[href='/tools']").click();
    await page.waitForURL(/.*\/tools$/);
    await expect(page.locator(".tools-directory")).toBeVisible();

    // The product you are in drops out of the bar and the analyzer takes its
    // slot, so there are always two ways on to the other two.
    await expect(nav.locator("a")).toHaveCount(2);
    await expect(nav.locator("a[href='/tools']")).toHaveCount(0);
    await expect(nav.locator("a[href='/']")).toHaveCount(1);

    await nav.locator("a[href='/wrapped']").click();
    await page.waitForURL(/.*\/wrapped$/);
    await expect(page.locator("label[for='dropzone-file']")).toBeVisible();
  });
});

test.describe("the error page", () => {
  test("carries the site chrome and a way out", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);

    await expect(page).toHaveTitle("This page doesn't exist");
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(page.locator(".site-footer")).toBeAttached();

    // Clearing the error is what actually gets the user off this page — a
    // NuxtLink on its own leaves it rendered over whatever it navigated to.
    await page.locator(".error-page__primary").click();
    await page.waitForURL(/.*:\d+\/$/);
    await expect(page.locator("#uploadmytextfile")).toBeAttached();
  });

  test("keeps the locale it was reached in", async ({ page }) => {
    await page.goto("/de/this-route-does-not-exist");

    await expect(page).toHaveTitle("Diese Seite gibt es nicht");
    await expect(page.locator(".error-page__primary")).toHaveAttribute(
      "href",
      "/de",
    );
  });
});
