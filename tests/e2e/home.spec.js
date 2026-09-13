const path = require("path");
const { expect, test } = require("@playwright/test");

const exampleChat = path.resolve(__dirname, "../../static/chat_example.txt");

test.beforeEach(async ({ page }) => {
  page.runtimeErrors = [];
  page.on("pageerror", (error) => page.runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("i18n_redirected", "en");
  });
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  expect(page.runtimeErrors).toEqual([]);
});

test("renders the analyzer landing page", async ({ page }) => {
  await expect(page).toHaveTitle(/WhatsAnalyze/);
  await expect(
    page.getByText("Analyze your WhatsApp Chat in Seconds", { exact: true })
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#uploadmytextfile")).toBeAttached();
});

test("analyzes the example chat without uploading its contents", async ({
  page,
}) => {
  // Renders every chart and builds two PDFs in a worker, which takes minutes
  // on a small runner.
  test.slow();

  const requests = [];
  let checkoutRequest;
  page.on("request", (request) => requests.push(request));
  await page.route("**/createCheckoutSession", async (route) => {
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

    checkoutRequest = request;
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        data: { url: "https://checkout.stripe.test/c/pay/cs_test_one_time" },
      }),
    });
  });
  await page.route("https://checkout.stripe.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "Stripe Checkout Mock" })
  );

  await page.locator("#uploadmytextfile").setInputFiles(exampleChat);

  await expect(page.getByText("Chat Timeline", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByText("Messages per Day", { exact: true })
  ).toBeVisible();

  const uploadedChatRequests = requests.filter((request) => {
    const body = request.postData() || "";
    return body.includes("Jane Doe") || body.includes("John Doe");
  });
  expect(uploadedChatRequests).toEqual([]);

  const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
  await page
    .getByRole("button", { name: /Download free preview PDF/i })
    .click();
  await downloadPromise;

  await page
    .getByRole("button", { name: /Download full chat PDF/i })
    .first()
    .click();
  await expect(page.getByText("Nice!!", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Buy Now \(7\.99 EUR\)/i }).click();

  await expect(page).toHaveURL(
    "https://checkout.stripe.test/c/pay/cs_test_one_time"
  );
  const checkoutPayload = checkoutRequest.postDataJSON().data;
  expect(checkoutPayload.mode).toBe("payment");
  expect(checkoutPayload.priceId).toBeTruthy();
});

test("switches to a localized route", async ({ page }) => {
  await page.getByLabel("Select language").selectOption("de");

  await expect(page).toHaveURL(/\/de\/?$/);
  await expect(
    page.getByText("Analysiere dein WhatsApp Chat in Sekunden", { exact: true })
  ).toBeVisible();
});

test("starts a subscription through Stripe checkout", async ({ page }) => {
  let checkoutRequest;
  await page.route("**/createCheckoutSession", async (route) => {
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

    checkoutRequest = request;
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        data: { url: "https://checkout.stripe.test/c/pay/cs_test_home" },
      }),
    });
  });
  await page.route("https://checkout.stripe.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "Stripe Checkout Mock" })
  );

  await page.goto("/subscribe");
  await page.getByRole("button", { name: "Subscribe Now" }).click();

  await expect(page).toHaveURL(
    "https://checkout.stripe.test/c/pay/cs_test_home"
  );
  expect(checkoutRequest).toBeTruthy();
});

test("activates a subscription after verifying on /subscribe", async ({
  page,
}) => {
  await page.route("**/verifySubscription", async (route) => {
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
      body: JSON.stringify({
        data: {
          isValid: true,
          customerName: "Sam Subscriber",
          expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
          customerId: "cus_home_123",
        },
      }),
    });
  });

  await page.goto(
    "/subscribe?email=sam@example.com&subscription_id=sub_test_home"
  );

  await expect(
    page.getByRole("heading", { name: "Your subscription is Active" })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("sub_test_home")).toBeVisible();
});

test("renders migrated markdown content", async ({ page }) => {
  await page.goto("/how-to-export-your-whatsapp-chat");

  await expect(page).toHaveTitle(/How to Export your WhatsApp Chat/);
  await expect(
    page.getByText("Export WhatsApp Chat: The Ultimate Guide", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Option 1: iPhone (iOS) - Export as a .txt File",
    })
  ).toBeVisible({ timeout: 15_000 });
});

test("opens the download section when linked straight to it", async ({
  page,
}) => {
  // "Open Chat Analyzer" on the subscribe page sends subscribers here for
  // their download, not for the hero.
  await page.locator("#uploadmytextfile").setInputFiles(exampleChat);
  await expect(page.getByText("Chat Timeline", { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  await page.goto("/#payButton");
  await expect(page.locator("#payButton")).toBeInViewport({ timeout: 30_000 });
});
