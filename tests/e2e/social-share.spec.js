const { analyzeChat, expect, test } = require("./fixtures");

/** The canvas currently on the preview stage, re-queried after every change. */
const previewCanvas = (page) => page.locator(".social-preview__stage canvas");

const previewFingerprint = (page) =>
  previewCanvas(page).evaluate((canvas) => canvas.toDataURL("image/png"));

const openShareCards = async (page) => {
  await page.goto("/");
  await analyzeChat(page);
  await page.getByRole("button", { name: "Create share cards" }).click();
  await expect(previewCanvas(page)).toBeVisible();
};

test.describe("social share cards", () => {
  test("renders both social formats at their native resolution", async ({
    page,
  }) => {
    await openShareCards(page);

    // 9:16 for stories and status, the format the modal opens on.
    await expect(previewCanvas(page)).toHaveJSProperty("width", 1080);
    await expect(previewCanvas(page)).toHaveJSProperty("height", 1920);

    await page.getByRole("button", { name: "Square 1:1" }).click();
    await expect(previewCanvas(page)).toHaveJSProperty("width", 1080);
    await expect(previewCanvas(page)).toHaveJSProperty("height", 1080);
  });

  test("offers a card per highlight and steps through them", async ({
    page,
  }) => {
    await openShareCards(page);

    // Overview, duel, clock, emoji podium and signature words for the example
    // chat, which has two participants.
    const dots = page.locator(".social-preview__dot");
    await expect(dots).toHaveCount(5);

    const first = await previewFingerprint(page);
    await page.getByRole("button", { name: "Next card" }).click();
    await expect(dots.nth(1)).toHaveClass(/social-preview__dot--active/);
    await expect.poll(() => previewFingerprint(page)).not.toBe(first);
  });

  test("re-renders the card when names are hidden", async ({ page }) => {
    await openShareCards(page);

    // The overview card carries no names, the duel card does.
    await page.getByRole("button", { name: "Next card" }).click();
    await page.getByRole("button", { name: "Full names" }).click();
    const withNames = await previewFingerprint(page);

    await page.getByRole("button", { name: "Anonymous" }).click();
    await expect.poll(() => previewFingerprint(page)).not.toBe(withNames);

    // Dropping the absolute counts leaves only the percentages on the card.
    const anonymous = await previewFingerprint(page);
    await page.getByLabel("Percentages only").check();
    await expect.poll(() => previewFingerprint(page)).not.toBe(anonymous);
  });

  test("downloads a single card and the whole set as a zip", async ({
    page,
  }) => {
    await openShareCards(page);

    // Desktop Chrome cannot share files, so the primary action downloads.
    const cardDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download", exact: true }).click();
    expect((await cardDownload).suggestedFilename()).toBe(
      "whatsanalyze-overview-story.png"
    );

    const zipDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download all (.zip)" }).click();
    expect((await zipDownload).suggestedFilename()).toBe(
      "whatsanalyze-cards-story.zip"
    );
  });
});
