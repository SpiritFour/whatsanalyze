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
  test("offers the privacy choices before creating a link", async ({
    page,
  }) => {
    await page.goto("/");
    await analyzeChat(page);
    await page.getByRole("button", { name: "Create a share link" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Share your highlights")).toBeVisible();

    // First names are the default: the safe option, not the revealing one.
    await expect(
      dialog.getByRole("button", { name: "First names" }),
    ).toHaveClass(/bg-wa-accent/);
    await expect(
      dialog.getByLabel("Show percentages only, no totals"),
    ).not.toBeChecked();

    await dialog.getByRole("button", { name: "Hidden" }).click();
    await expect(dialog.getByRole("button", { name: "Hidden" })).toHaveClass(
      /bg-wa-accent/,
    );
  });

  test("tells the visitor when a share link carries no key", async ({
    page,
  }) => {
    // No fragment means nothing to decrypt, which has to read as a dead link
    // rather than an empty page.
    await page.goto("/shared");

    await expect(
      page.getByText("These highlights are not available"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Analyze my chat" }),
    ).toBeVisible();
  });

  test("keeps the decryption key out of everything but the fragment", async ({
    page,
  }) => {
    const sent = [];
    page.on("request", (request) => {
      const referer = request.headers().referer || "";
      if (/key=|iv=/.test(request.url() + referer)) sent.push(request.url());
    });

    await page.goto(
      "/shared?utm_source=user_share&utm_medium=link#uuid=e2e&iv=%5B1%5D&key=%5B2%5D",
    );
    await expect(
      page.getByText("These highlights are not available"),
    ).toBeVisible();

    expect(sent).toEqual([]);
  });
});
