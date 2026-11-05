/**
 * /tools/what-to-reply: a landing page whose drop box hands the chat to the
 * AI page, where the coach opens under a reading. Only synthetic chats here.
 */
const {
  EXAMPLE_CHAT,
  analyzeChat,
  expect,
  otherChatFile,
  test,
} = require("./fixtures");

const PAGE = "/tools/what-to-reply";
/** The AI page with the preset this page picks. */
const COACH_URL = /\/tools\/ai-chat-analyzer\/?\?ask=better$/;

test.describe("what to reply", () => {
  test("renders in English and German @mobile", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator("h1")).toHaveText("What should I reply?");
    // Whole, brand included: a "|" in a message is vue-i18n's plural
    // separator, and it cut the brand off the title silently.
    await expect(page).toHaveTitle(
      "What Should I Reply? AI Reply Help for WhatsApp – WhatsAnalyze",
    );
    // Nothing wider than the phone: no sideways scrolling.
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    await page.goto(`/de${PAGE}`);
    await expect(page.locator("h1")).toHaveText("Was soll ich antworten?");
    await expect(page).toHaveTitle(
      "Was soll ich antworten? KI-Hilfe für deine WhatsApp-Antwort – WhatsAnalyze",
    );
    // The coach's own support resources, as it shows them.
    await expect(page.getByText("Telefonseelsorge")).toBeVisible();
  });

  test("takes an uploaded chat to the AI page with a question picked", async ({
    page,
  }) => {
    await page.goto(PAGE);
    await page
      .locator("input.hidden-file-input")
      .setInputFiles(otherChatFile());
    await page.waitForURL(COACH_URL);
    await expect(page.locator("#ai-choose")).toBeVisible();
    await expect(
      page.locator(".ask__chips .chip--on", {
        hasText: "How could we communicate better?",
      }),
    ).toBeVisible();

    // Coming back with the chat still open offers the way on, rather than
    // bouncing straight to the AI page again.
    await page.goto(PAGE);
    const next = page.getByRole("link", {
      name: "Get help replying with this chat",
    });
    await expect(next).toBeVisible();
    await expect(page).toHaveURL(/\/tools\/what-to-reply\/?$/);
    await next.click();
    await page.waitForURL(COACH_URL);
    await expect(page.locator("#ai-choose")).toBeVisible();
  });

  test("offers a chat saved on an earlier visit", async ({ page, context }) => {
    // Nothing saved: no offer.
    await page.goto(PAGE);
    await expect(page.locator(".library-offer")).toHaveCount(0);

    await page.goto("/");
    await analyzeChat(page, EXAMPLE_CHAT);
    await expect(page.locator(".library-status")).toContainText(
      "Saved on this device",
    );

    // Another tab, so no chat is open there yet.
    const later = await context.newPage();
    await later.goto(PAGE);
    const offer = later.locator(".library-offer");
    // "chat_example.txt" names nobody, so the saved chat goes by its people.
    await expect(offer).toContainText(
      "Get help replying to John Doe and Jane Doe",
    );
    await expect(offer).toContainText("Saved on this device · no new upload");
    await offer.getByRole("button").click();
    await later.waitForURL(COACH_URL);
    await expect(later.locator("#ai-choose")).toBeVisible();
    await expect(
      later.getByText(/messages • no new upload needed/),
    ).toBeVisible();
  });
});
