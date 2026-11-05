/**
 * Saved chats (docs/saved-chats.md): every upload is kept on the device, a
 * returning visitor opens it again from "Your chats" or any tool, and it can
 * be forgotten from anywhere. Playwright gives every test a fresh browser
 * context, so each one starts with no saved chats.
 */
const fs = require("fs");
const {
  EXAMPLE_CHAT,
  activeSubscription,
  analyzeChat,
  expect,
  expectAnalysis,
  stubCallable,
  test,
  zipExport,
} = require("./fixtures");

const status = (page) => page.locator(".library-status");
const yourChats = (page) => page.locator(".library-chats");

test.describe("saved chats", () => {
  test("keeps an upload, opens it again in a tool, and forgets it everywhere", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await analyzeChat(page);
    await expect(status(page)).toContainText("Saved on this device");

    // A reload brings it back, and the visitor sees it among their chats.
    await page.reload();
    await expectAnalysis(page);
    await expect(yourChats(page)).toContainText("Your chats");
    await expect(yourChats(page).locator("li")).toHaveCount(1);
    await expect(yourChats(page)).toContainText("Jane Doe");

    // Another tab: no chat open there, so the tool offers the saved one.
    const tool = await context.newPage();
    await tool.goto("/tools/inactivity");
    const picker = tool.locator(".library-picker");
    await expect(picker).toContainText("Use a saved chat");
    await picker.getByRole("button", { name: "Open" }).click();
    await expect(tool.locator(".hero-metric-card")).toBeVisible();
    await expect(
      tool.getByText(/messages • no new upload needed/),
    ).toBeVisible();
    await expect(status(tool)).toContainText("Saved on this device");

    // Forget it from the chip's panel: gone here, and from the list in the
    // first tab, which hears about it over the BroadcastChannel.
    await status(tool)
      .getByRole("button", { name: "Saved on this device" })
      .click();
    const panel = tool.getByRole("dialog");
    await expect(panel).toContainText("Anyone who uses this browser");
    await panel.getByRole("button", { name: "Forget this chat" }).click();
    await tool.waitForLoadState("load");
    await expect(tool.locator(".hero-metric-card")).toHaveCount(0);
    await expect(tool.locator(".library-picker")).toHaveCount(0);
    await expect(yourChats(page)).toHaveCount(0);
  });

  test("“Don't keep” leaves the chat for this tab only", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);
    await status(page).getByRole("button", { name: "Don't keep" }).click();
    await expect(status(page)).toContainText("Not kept on this device");
    await expect(
      status(page).getByRole("button", { name: "Keep it" }),
    ).toBeVisible();

    // Still there after a reload, as an unsaved chat always was, but not
    // among the saved ones.
    await page.reload();
    await expectAnalysis(page);
    await expect(status(page)).toContainText("Not kept on this device");
    await expect(yourChats(page)).toHaveCount(0);
  });

  test("never keeps the sample chat", async ({ page }) => {
    await page.goto("/tools/inactivity");
    await page.locator(".btn-ghost").click();
    await expect(page.locator(".hero-metric-card")).toBeVisible();
    await expect(status(page)).toHaveCount(0);

    await page.goto("/");
    await expectAnalysis(page);
    await expect(status(page)).toHaveCount(0);
    await expect(yourChats(page)).toHaveCount(0);
  });

  test("says so when the browser refuses storage, and keeps the chat for the tab", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      IDBFactory.prototype.open = () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      };
    });
    await page.goto("/");
    await analyzeChat(page);
    await expect(status(page)).toContainText("Not kept on this device");
    await expect(status(page)).toContainText("private window");

    await page.reload();
    await expectAnalysis(page);
  });

  test("recognizes the same chat in another export instead of saving it twice", async ({
    page,
  }) => {
    await page.goto("/");
    await analyzeChat(page);
    await expect(status(page)).toContainText("Saved on this device");
    // The same chat again, now as a zip with a photo in it.
    await page.locator("#uploadmytextfile").setInputFiles(await zipExport());
    await expectAnalysis(page);
    await expect(status(page)).toContainText("Saved on this device");

    await page.reload();
    await expect(yourChats(page).locator("li")).toHaveCount(1);
  });

  test("reads the chat, not another chat attached to it", async ({ page }) => {
    // iOS names the chat _chat.txt; a .txt sent in the chat is media.
    const JSZip = require("jszip");
    const zip = new JSZip();
    zip.file(
      "00000042-WhatsApp Chat - Someone Else.txt",
      "[1/2/21, 09:00:00] Someone Else: a different chat\n[1/2/21, 09:01:00] Another Person: entirely",
    );
    zip.file("_chat.txt", fs.readFileSync(EXAMPLE_CHAT));
    await page.goto("/");
    await page.locator("#uploadmytextfile").setInputFiles({
      name: "WhatsApp Chat - Jane Doe.zip",
      mimeType: "application/zip",
      buffer: await zip.generateAsync({ type: "nodebuffer" }),
    });
    await expectAnalysis(page);
    await expect(
      page.locator("#download-graphs").getByText("536", { exact: true }),
    ).toBeVisible();

    await page.reload();
    await expect(yourChats(page)).toContainText("Jane Doe");
    await expect(yourChats(page)).not.toContainText("Someone Else");
  });

  test("restores a backup dropped on the upload box", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);
    await expect(status(page)).toContainText("Saved on this device");

    await status(page)
      .getByRole("button", { name: "Saved on this device" })
      .click();
    const panel = page.getByRole("dialog");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      panel.getByRole("button", { name: "Download backup" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^whatsanalyze-backup-\d{4}-\d\d-\d\d\.json\.gz$/,
    );
    const backup = await download.path();

    // Forget everything, which starts the page over with nothing saved.
    await panel.getByRole("button", { name: "Forget everything" }).click();
    await panel.getByRole("button", { name: "Forget everything" }).click();
    await page.waitForLoadState("load");
    await page.waitForFunction(
      () => document.documentElement.dataset.hydrated === "true",
    );
    await expect(yourChats(page)).toHaveCount(0);
    expect(
      await page.evaluate(async () =>
        (await indexedDB.databases()).map((db) => db.name),
      ),
    ).not.toContain("whatsanalyze_library");

    await page.locator("#uploadmytextfile").setInputFiles({
      name: download.suggestedFilename(),
      mimeType: "application/gzip",
      buffer: fs.readFileSync(backup),
    });
    await expect(
      page.getByText("Chats restored from the backup: 1"),
    ).toBeVisible();
    await expect(yourChats(page)).toContainText("Jane Doe");
  });

  test("opens a saved chat's Wrapped without spending the day's free analysis", async ({
    page,
  }) => {
    const today = new Date().toLocaleDateString("sv"); // YYYY-MM-DD
    await page.goto("/wrapped");
    await page.locator("#dropzone-file").setInputFiles(EXAMPLE_CHAT);
    await page.waitForURL(/wrapped\/results/);
    await expect(status(page)).toContainText("Saved on this device");
    expect(
      await page.evaluate(() => localStorage.getItem("uploadAccess")),
    ).toContain(today);

    // Today's free analysis is used, but this chat was unwrapped already.
    await page.goto("/wrapped");
    const picker = page.locator(".library-picker");
    await picker.getByRole("button", { name: "Open" }).click();
    await page.waitForURL(/wrapped\/results/);
    await expect(page.locator(".wrapped-scope")).toBeVisible();
    await expect(
      page.getByText("Your free analysis for today is used up"),
    ).toHaveCount(0);
  });
});

test.describe("continue where you left off", () => {
  const item = (title) => ({ title, description: `${title} in detail` });
  const insights = {
    answer: "",
    summary: "Two friends planning trips.",
    vibe: "Travel buddies",
    people: [{ name: "Person A", role: "Planner", style: "Long messages" }],
    dynamics: [item("Quick replies")],
    topics: [item("Weekend plans")],
    highlights: ["The lost passport"],
  };

  test("remembers which participant is “me”", async ({ page }) => {
    await page.goto("/tools/ai-chat-analyzer/");
    await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
    await expect(status(page)).toContainText("Saved on this device");
    const me = page.locator(".ask__chips").first().locator(".chip").first();
    await me.click();
    await expect(me).toHaveClass(/chip--on/);

    await page.reload();
    await expect(page.locator("#ai-choose")).toBeVisible();
    await expect(
      page.locator(".ask__chips").first().locator(".chip--on"),
    ).toHaveText(await me.textContent());
  });

  test("keeps every reading and the coach conversation with the saved chat", async ({
    page,
    context,
  }) => {
    const preview = await stubCallable(page, "analyzeChatAi", {
      insights,
      locked: { people: 1, dynamics: 2, topics: 3, highlights: 2 },
    });
    await page.goto("/tools/ai-chat-analyzer/");
    await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
    await page
      .getByRole("button", { name: "Try a free cloud preview" })
      .click();
    const report = page.locator("#ai-report");
    await expect(report.locator(".report-card--locked")).toHaveCount(7);

    // Subscribed: the full report runs, and both readings are kept.
    await stubCallable(page, "getCheckoutSession", {
      mode: "subscription",
      payment_status: "paid",
      subscription: "sub_test123",
      customer_details: { email: "test@example.com" },
    });
    await stubCallable(page, "verifySubscription", activeSubscription());
    await stubCallable(page, "getAiAllowance", { remaining: 5, limit: 10 });
    const full = await stubCallable(page, "analyzeChatAi", {
      insights: { ...insights, topics: [item("Weekend plans"), item("Food")] },
      remaining: 4,
      limit: 10,
    });
    await page.goto(
      `/subscribe?session_id=cs_test_subscription&from=${encodeURIComponent("/tools/ai-chat-analyzer/")}`,
    );
    await page.waitForURL((url) => url.pathname.includes("/ai-chat-analyzer"));
    await expect(report.getByText("Food", { exact: true })).toBeVisible();
    const readings = report.locator(".library-readings__item");
    await expect(readings).toHaveCount(2);
    await expect(readings.first()).toContainText("Cloud");
    await expect(readings.nth(1)).toContainText("Cloud preview");

    // A coach exchange, kept with the reading it followed.
    await stubCallable(page, "coachChatAi", {
      reply: "Bring up the lost passport.",
      remaining: 3,
      limit: 10,
    });
    await report.locator(".coach__input").fill("What should I bring up?");
    await report.getByRole("button", { name: "Send" }).click();
    await expect(report.getByText("Bring up the lost passport.")).toBeVisible();

    // Another tab, another day: open the saved chat and it's all there,
    // without running anything again.
    const later = await context.newPage();
    await stubCallable(later, "getAiAllowance", { remaining: 3, limit: 10 });
    await stubCallable(later, "verifySubscription", activeSubscription());
    const rerun = await stubCallable(later, "analyzeChatAi", { insights });
    await later.goto("/tools/ai-chat-analyzer/");
    await later
      .locator(".library-picker")
      .getByRole("button", { name: "Open" })
      .click();
    const again = later.locator("#ai-report");
    await expect(again.getByText("Food", { exact: true })).toBeVisible();
    await expect(again.getByText("What should I bring up?")).toBeVisible();
    await expect(again.locator(".library-readings__item")).toHaveCount(2);

    // The earlier reading, the preview, is one click away.
    await again.locator(".library-readings__item").nth(1).click();
    await expect(again.locator(".report-card--locked")).toHaveCount(7);
    expect(preview.length).toBe(1);
    expect(full.length).toBe(1);
    expect(rerun.length).toBe(0);
  });
});
