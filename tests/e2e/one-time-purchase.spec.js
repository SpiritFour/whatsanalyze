const path = require("path");
const { expect, test } = require("@playwright/test");

const exampleChat = path.resolve(__dirname, "../../static/chat_example.txt");

const stubCheckoutSession = async (page, session) => {
  await page.route("**/getCheckoutSession", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "content-type",
        },
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ data: session }),
    });
  });
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("i18n_redirected", "en");
  });
});

test("delivers the full PDF after returning from a paid one-time checkout", async ({
  page,
}) => {
  await stubCheckoutSession(page, {
    mode: "payment",
    payment_status: "paid",
    customer_details: { email: "buyer@example.com" },
  });

  // Analyze a chat first: that is what the one-time payment buys, and it has
  // to survive the redirect to Stripe and back.
  await page.goto("/");
  await page.locator("#uploadmytextfile").setInputFiles(exampleChat);
  await expect(page.getByText("Chat Timeline", { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  // Stripe sends the buyer back to the homepage with the paid session.
  const downloadPromise = page.waitForEvent("download", { timeout: 90_000 });
  await page.goto("/?session_id=cs_test_paid&payment_success=true");

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

  // The proof of payment must not stay in the URL, where a reload or a shared
  // link would replay it.
  await expect(page).toHaveURL(/\/$/);

  // The full PDF stays unlocked for the session instead of showing the
  // pricing table again.
  await expect(page.getByText("Choose Your Plan")).toHaveCount(0);
});

test("keeps the paywall closed when the checkout session was not paid", async ({
  page,
}) => {
  await stubCheckoutSession(page, {
    mode: "payment",
    payment_status: "unpaid",
    customer_details: { email: "buyer@example.com" },
  });

  await page.goto("/");
  await page.locator("#uploadmytextfile").setInputFiles(exampleChat);
  await expect(page.getByText("Chat Timeline", { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  await page.goto("/?session_id=cs_test_unpaid&payment_success=true");

  await expect(page.getByText("Choose Your Plan")).toBeVisible({
    timeout: 30_000,
  });
});
