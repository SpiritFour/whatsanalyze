/**
 * /tools/always-texting-first: a situation page that counts who starts the
 * conversations right under its hero, then hands the chat to the AI with
 * "Who puts more effort into this chat?" already asked.
 */
const { EXAMPLE_CHAT, expect, test } = require("./fixtures");

const PAGE = "/tools/always-texting-first/";
const EFFORT = "Who puts more effort into this chat?";
const upload = (page) => page.locator("#dropzone-slot input[type=file]");
const results = (page) => page.locator("#texting-first-results");

/** Three conversations: Alice starts two, Bob one. */
const shortChat = () => {
  const lines = [
    "1/2/21, 09:00 - Alice: hi",
    "1/2/21, 09:05 - Bob: hey",
    "1/3/21, 10:00 - Alice: morning",
    "1/3/21, 10:30 - Bob: hello",
    "1/4/21, 20:00 - Bob: any news?",
    "1/4/21, 20:10 - Alice: yes",
  ];
  return {
    name: "short_chat.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(lines.join("\n"), "utf-8"),
  };
};

test.describe("always texting first", () => {
  for (const [path, title] of [
    [PAGE, "Always the one texting first?"],
    [`/de${PAGE}`, "Schreibst du immer zuerst?"],
  ]) {
    test(`renders ${path} @mobile`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(upload(page)).toBeAttached();
      // The example's made-up people, through the same view as a real chat.
      await expect(page.locator(".example .texting-first__card")).toHaveCount(
        2,
      );
      // Nothing is saved yet, so there is nothing to offer.
      await expect(page.locator(".library-offer")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    });
  }

  test("counts who starts and hands the chat to the AI with the effort question", async ({
    page,
  }) => {
    await page.goto(PAGE);
    await upload(page).setInputFiles(EXAMPLE_CHAT);
    const numbers = results(page);
    await expect(numbers.locator(".texting-first__card")).toHaveCount(2);
    await expect(numbers).toContainText("Jane Doe");
    await expect(numbers).toContainText("John Doe");

    await numbers
      .getByRole("link", { name: "Ask who puts in more effort" })
      .click();
    await page.waitForURL(
      (url) =>
        /\/tools\/ai-chat-analyzer\/?$/.test(url.pathname) &&
        url.searchParams.get("ask") === "effort",
    );
    // The chat came along, and the question is already picked.
    await expect(
      page.getByText(/messages • no new upload needed/),
    ).toBeVisible();
    await expect(page.locator("#ai-choose .chip--on")).toHaveText(EFFORT);
  });

  test("shows each person's share next to their reply time, and says when a chat is short", async ({
    page,
  }) => {
    await page.goto(PAGE);
    await upload(page).setInputFiles(shortChat());
    const numbers = results(page);
    await expect(numbers).toContainText("Conversations so far: 3");

    const card = (name) =>
      numbers.locator(".texting-first__card").filter({ hasText: name });
    await expect(card("Alice")).toContainText("67%");
    await expect(card("Alice")).toContainText("2 of 3 conversations");
    await expect(card("Alice")).toContainText("10 min");
    await expect(card("Bob")).toContainText("33%");
    await expect(card("Bob")).toContainText("1 of 3 conversations");
    await expect(card("Bob")).toContainText("18 min");
  });

  test("offers a saved chat's effort reading once a chat is saved", async ({
    page,
    context,
  }) => {
    await page.goto(PAGE);
    await expect(page.locator(".library-offer")).toHaveCount(0);
    await upload(page).setInputFiles(EXAMPLE_CHAT);
    await expect(page.locator(".library-status")).toContainText(
      "Saved on this device",
    );
    await expect(page.locator(".library-offer")).toHaveCount(1);

    // Another tab with no chat open: the saved one is offered.
    const later = await context.newPage();
    await later.goto(PAGE);
    const offer = later.locator(".library-offer");
    await expect(offer).toContainText(
      "Ask who puts in more effort in your chat with",
    );
    await offer.getByRole("button").click();
    await later.waitForURL(
      (url) =>
        /\/tools\/ai-chat-analyzer\/?$/.test(url.pathname) &&
        url.searchParams.get("ask") === "effort",
    );
    await expect(later.locator("#ai-choose .chip--on")).toHaveText(EFFORT);
  });
});
