const { expect, test } = require("@playwright/test");

test.describe("Footer Links & Tools Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("i18n_redirected", "en");
    });
  });

  test("footer contains valid non-empty links for all pages", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector(".foot");

    const links = await page.locator(".foot a").all();
    expect(links.length).toBeGreaterThanOrEqual(10);

    for (const link of links) {
      const href = await link.getAttribute("href");
      const text = (await link.innerText()).trim();
      expect(href, `Link "${text}" must have a non-null href`).not.toBeNull();
      expect(href, `Link "${text}" must not have an empty href`).not.toBe("");
    }
  });

  test("footer links navigate to tool pages successfully", async ({ page }) => {
    const toolPaths = [
      "/tools/court-evidence",
      "/tools/proof-of-relationship",
      "/tools/inactivity",
      "/tools/message-counter",
      "/tools/word-counter",
      "/tools/chat-heatmap",
    ];

    for (const toolPath of toolPaths) {
      const response = await page.goto(toolPath);
      expect(response?.status()).toBe(200);
      await expect(page.locator(".landing-hero__title")).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("tools directory showcases two separated groups and all 6 tools", async ({
    page,
  }) => {
    await page.goto("/tools");
    await page.waitForSelector(".tools-directory");

    const groups = page.locator(".tools-group");
    await expect(groups).toHaveCount(2);

    // Group 1: Chat Analytics (4 cards)
    const analyticsCards = groups.nth(0).locator(".tool-card");
    await expect(analyticsCards).toHaveCount(4);

    // Group 2: Court Documentation (2 cards)
    const courtCards = groups.nth(1).locator(".tool-card");
    await expect(courtCards).toHaveCount(2);
    await expect(
      courtCards.first().locator(".tool-card__court-badge")
    ).toHaveText("PDF");
  });

  test("tool CTA after upload navigates directly to actual results on main page", async ({
    page,
  }) => {
    await page.goto("/tools/inactivity");
    await page.waitForSelector(".btn-ghost");

    // Click sample chat button
    await page.locator(".btn-ghost").click();
    await expect(page.locator(".hero-metric-card")).toBeVisible({
      timeout: 15_000,
    });

    // Click CTA to explore full analysis
    const cta = page.locator(".hook-actions a");
    await expect(cta).toBeVisible();
    await cta.click();

    // Verify navigation to main page with results
    await page.waitForURL(/.*#results/);
    await expect(page.locator("#results")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".active-chat-bar")).toBeVisible();
    await expect(page.locator(".active-chat-bar")).toContainText(
      "Complete Analysis"
    );

    // Verify the upload hero is hidden
    const aboveTheFold = page.locator(".top-color");
    await expect(aboveTheFold).toBeHidden();
  });

  test("tools header button shows dropdown on hover and navigates to tools or specific tool", async ({
    page,
  }) => {
    await page.goto("/");
    const toolsBtn = page.locator(".header-tools-link");
    await expect(toolsBtn).toBeVisible();

    // Hover over Tools button
    await toolsBtn.hover();
    const dropdown = page.locator(".tools-dropdown-menu");
    await expect(dropdown).toBeVisible({ timeout: 5_000 });

    // Verify all 6 tools are present in dropdown
    const toolItems = dropdown.locator(".dropdown-tool-item");
    await expect(toolItems).toHaveCount(6);

    // Click on Inactivity Tracker item
    await toolItems.first().click();
    await page.waitForURL(/.*\/tools\/inactivity/);
    await expect(page.locator(".landing-hero__title")).toBeVisible();

    // Verify clicking header Tools link itself navigates to /tools
    await page.locator(".header-tools-link").click();
    await page.waitForURL(/.*\/tools$/);
    await expect(page.locator(".tools-directory")).toBeVisible();
  });
});
