/**
 * /tools/same-fight-again: a landing page for someone who keeps having the
 * same argument. It hands the chat to the AI with "How could we communicate
 * better?" already picked, and never the "arguments" question, which would
 * pick a winner.
 */
const { EXAMPLE_CHAT, analyzeChat, expect, test } = require("./fixtures");

const PAGE = "/tools/same-fight-again";

/** On the AI page, the chat already there and the question already picked. */
const expectAiWithBetter = async (page) => {
  await expect(page).toHaveURL(/\/tools\/ai-chat-analyzer\/?\?ask=better$/);
  await expect(page.locator("#ai-choose")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "How could we communicate better?" }),
  ).toHaveClass(/chip--on/);
  await expect(
    page.getByRole("button", {
      name: "Who has the more convincing arguments?",
    }),
  ).not.toHaveClass(/chip--on/);
};

test.describe("same fight again", () => {
  test("renders in English and German", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator("h1")).toHaveText(
      "Why do we keep having the same fight?",
    );
    await expect(page).toHaveTitle(/WhatsApp/);
    // The example reads the same question the drop box hands over.
    await expect(page.locator(".example")).toContainText(
      "How could we communicate better?",
    );
    // No saved chat in a fresh browser, so no offer to run on one.
    await expect(page.locator(".library-offer")).toHaveCount(0);

    await page.goto(`/de${PAGE}`);
    await expect(page.locator("h1")).toHaveText(
      "Warum streiten wir immer wieder über dasselbe?",
    );
    await expect(page).toHaveTitle(/WhatsApp/);
    await expect(page.locator("html")).toHaveAttribute("lang", /^de/);
  });

  test("hands a dropped chat to the AI with the right question", async ({
    page,
  }) => {
    await page.goto(PAGE);
    await page
      .locator("#dropzone-slot input[type=file]")
      .setInputFiles(EXAMPLE_CHAT);
    await expectAiWithBetter(page);
  });

  test("offers a saved chat, and doesn't bounce the tab that has it open", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await analyzeChat(page);

    // A new tab has no chat open, so the offer is the way in.
    const fresh = await context.newPage();
    await fresh.goto(PAGE);
    const offer = fresh.locator(".library-offer");
    await expect(offer).toContainText("Run this on your chat with");
    await offer.getByRole("button").click();
    await expectAiWithBetter(fresh);

    // The tab that already has the chat gets it back in the drop box and a
    // button to go on, not a jump straight to the AI.
    await page.goto(PAGE);
    const next = page.getByRole("link", { name: "Continue with this chat" });
    await expect(next).toBeVisible();
    await expect(page).toHaveURL(/\/tools\/same-fight-again\/?$/);
    await next.click();
    await expectAiWithBetter(page);
  });
});
