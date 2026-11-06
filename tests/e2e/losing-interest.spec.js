/**
 * /tools/losing-interest: the numbers for someone worried that replies are
 * getting slower, shown on the page itself, with the AI's "worried" reading
 * as the next step. Every chat here is the synthetic sample.
 */
const { EXAMPLE_CHAT, expect, test } = require("./fixtures");

const PAGE = "/tools/losing-interest/";
const upload = (page) => page.locator("input.hidden-file-input");
const results = (page) => page.locator("#results");

test.describe("are they losing interest?", () => {
  test("renders in English and German", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator("h1")).toHaveText("Are they losing interest?");
    await expect(page).toHaveTitle(/^Losing Interest or Just Busy\?/);

    await page.goto(`/de${PAGE}`);
    await expect(page.locator("h1")).toHaveText("Lässt das Interesse nach?");
    await expect(page).toHaveTitle(/^Verliert er oder sie das Interesse\?/);
  });

  test("shows the numbers on the page, then hands the chat to the AI with the worried question", async ({
    page,
  }) => {
    await page.goto(PAGE);
    await upload(page).setInputFiles(EXAMPLE_CHAT);

    await expect(results(page)).toBeVisible();
    // On screen the moment it renders, not after a scroll reveal.
    await expect(results(page).locator(".landing-section__inner")).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(results(page)).toContainText(
      /The last message was .+ ago, from (Jane|John) Doe\./,
    );
    const people = results(page).locator(".li-person");
    await expect(people).toHaveCount(2);
    await expect(people.filter({ hasText: "Jane Doe" })).toContainText(
      "Average reply",
    );
    await expect(people.filter({ hasText: "John Doe" })).toContainText(
      "Wrote first",
    );
    await expect(results(page).locator(".li-gap")).toHaveCount(3);

    await results(page)
      .getByRole("link", { name: "Ask the AI about this chat" })
      .click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/tools/ai-chat-analyzer/" &&
        url.searchParams.get("ask") === "worried",
    );
    // The question is picked, and the chat came along without a new upload.
    await expect(
      page.locator(".chip--on", {
        hasText: "Is there anything I should be worried about?",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/messages • no new upload needed/),
    ).toBeVisible();
  });

  test("takes the chat to the analyzer's timeline", async ({ page }) => {
    await page.goto(PAGE);
    await upload(page).setInputFiles(EXAMPLE_CHAT);
    await results(page)
      .getByRole("link", { name: "See your messages over time" })
      .click();

    await page.waitForURL(/\/#results$/);
    await expect(
      page.getByText("Chat Timeline", { exact: true }),
    ).toBeVisible();
  });

  test("offers the AI reading for a chat saved on this device", async ({
    page,
    context,
  }) => {
    // Nothing saved, nothing offered.
    await page.goto(PAGE);
    await expect(page.locator(".library-offer")).toHaveCount(0);

    // An upload is saved on the device by default.
    await upload(page).setInputFiles(EXAMPLE_CHAT);
    await expect(page.locator(".library-status")).toContainText(
      "Saved on this device",
    );

    // A visitor coming back in another tab, with no chat open there.
    const later = await context.newPage();
    await later.goto(PAGE);
    const offer = later.locator(".library-offer");
    // "chat_example.txt" names nobody, so the saved chat goes by its people.
    await expect(offer).toContainText(
      "Ask the AI about your chat with John Doe and Jane Doe",
    );
    await offer.getByRole("button").click();
    await later.waitForURL(
      (url) =>
        url.pathname === "/tools/ai-chat-analyzer/" &&
        url.searchParams.get("ask") === "worried",
    );
    await expect(
      later.getByText(/messages • no new upload needed/),
    ).toBeVisible();
  });

  test("fits a phone screen @mobile", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator(".btn-ghost").click();
    await expect(results(page)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
