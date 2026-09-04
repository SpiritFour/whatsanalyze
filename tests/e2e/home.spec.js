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
  const requests = [];
  let paypalSdkUrl;
  page.on("request", (request) => requests.push(request));
  await page.route("https://www.paypal.com/sdk/js?**", async (route) => {
    paypalSdkUrl = new URL(route.request().url());
    await route.fulfill({
      contentType: "text/javascript",
      body: `
        window.paypal = {
          Buttons: () => ({
            render: (selector) => {
              document.querySelector(selector).innerHTML =
                '<button type="button">Pay with PayPal</button>';
              return Promise.resolve();
            }
          })
        };
      `,
    });
  });

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

  const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
  await page
    .getByRole("button", { name: /Download free preview PDF/i })
    .click();
  await downloadPromise;

  await page.getByRole("button", { name: /Download full chat PDF/i }).click();
  await expect(page.getByText("Nice!!", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pay with PayPal" })
  ).toBeVisible();
  expect(paypalSdkUrl.origin).toBe("https://www.paypal.com");
  expect(paypalSdkUrl.searchParams.get("currency")).toBe("EUR");
  expect(paypalSdkUrl.searchParams.get("client-id")).toBeTruthy();
});

test("switches to a localized route", async ({ page }) => {
  await page.getByLabel("Select language").selectOption("de");

  await expect(page).toHaveURL(/\/de\/?$/);
  await expect(
    page.getByText("Analysiere dein WhatsApp Chat in Sekunden", { exact: true })
  ).toBeVisible();
});

test("starts a subscription through the Firebase PayPal endpoint", async ({
  page,
}) => {
  let functionRequest;
  await page.route("**/helloworld", async (route) => {
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

    functionRequest = request;
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        data: { approveLink: "https://paypal.test/approve" },
      }),
    });
  });
  await page.route("https://paypal.test/approve", (route) =>
    route.fulfill({ contentType: "text/html", body: "PayPal approval" })
  );

  await page.goto("/subscribe");
  await page.getByRole("button", { name: "Subscribe Now" }).click();

  await expect(page).toHaveURL("https://paypal.test/approve");
  expect(functionRequest.url()).toBe(
    "https://us-central1-whatsanalyze-80665.cloudfunctions.net/helloworld"
  );
  expect(functionRequest.postDataJSON().data.client_id).toBeTruthy();
});

test("activates a subscription after returning from PayPal", async ({
  page,
}) => {
  let statusChecks = 0;
  await page.route("**/checksubscriberstatus", async (route) => {
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

    statusChecks += 1;
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        data: {
          isValid: statusChecks > 1,
          data: { subscriptionId: "I-TEST-SUBSCRIPTION" },
        },
      }),
    });
  });

  await page.goto("/subscribe?subscription_id=I-TEST-SUBSCRIPTION");

  // The checker polls every 3s and the dev server may still be compiling
  // /subscribe on first visit, so allow generous headroom on slow runners.
  await expect(
    page.getByRole("heading", { name: "Your subscription is Active" })
  ).toBeVisible({ timeout: 30_000 });
  expect(statusChecks).toBe(2);
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
