const { analyzeChat, expect, test } = require("./fixtures");

const HIGHLIGHT_TITLES = [
  "Who talks more?",
  "Night owl vs. early bird",
  "Most used emojis",
  "Words only they use",
];

test.describe("chat highlights", () => {
  test("adds a card per highlight to the results", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);

    for (const title of HIGHLIGHT_TITLES) {
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    }

    // The overview is left out here because ChartsTextStats above already
    // carries the same numbers.
    await expect(
      page.getByRole("heading", { name: "The whole story in numbers" }),
    ).toHaveCount(0);
  });

  test("shares a highlight as an image like any other chart", async ({
    page,
  }) => {
    await page.goto("/");
    await analyzeChat(page);

    // Desktop Chrome cannot share files, so the share button downloads.
    const download = page.waitForEvent("download");
    await page
      .locator("#highlight-duel")
      .getByRole("button", { name: "Download Results" })
      .click();
    expect((await download).suggestedFilename()).toContain("highlight-duel");
  });
});

test.describe("share link", () => {
  test("offers one button and no options", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);

    // A link carries the whole analysis, so there is nothing to choose.
    await expect(
      page.getByRole("button", { name: "Create link and copy" }),
    ).toBeVisible();
    await expect(page.getByText("Full names")).toHaveCount(0);
    await expect(
      page.getByText("Show percentages only, no totals"),
    ).toHaveCount(0);
  });

  test("does not offer to pass someone else's chat on", async ({ page }) => {
    await page.goto("/s");
    await expect(
      page.getByRole("button", { name: /Create link and/ }),
    ).toHaveCount(0);
  });

  test("tells the visitor when a share link carries no key", async ({
    page,
  }) => {
    // No fragment means nothing to decrypt, which has to read as a dead link
    // rather than an empty page.
    await page.goto("/s");

    await expect(
      page.getByText("These results are not available"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Analyze my chat" }),
    ).toBeVisible();
  });

  test("keeps the decryption key out of everything but the fragment", async ({
    page,
  }) => {
    // A token that would be unmistakable if it showed up anywhere it should
    // not. The whole secret is in the fragment now, so look for the fragment.
    const TOKEN = "Zz9" + "A".repeat(77);
    const sent = [];
    page.on("request", (request) => {
      const referer = request.headers().referer || "";
      if ((request.url() + referer).includes(TOKEN)) sent.push(request.url());
    });

    await page.goto(`/s#${TOKEN}`);
    await expect(
      page.getByText("These results are not available"),
    ).toBeVisible();

    expect(sent).toEqual([]);
  });
});
