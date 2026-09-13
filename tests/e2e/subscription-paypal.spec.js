const { expect, test } = require("@playwright/test");

// Customers who subscribed before the move to Stripe still log in on the same
// page with their PayPal subscription id. Those subscriptions live in the old
// project and are unknown to verifySubscription.
test.beforeEach(async ({ page }) => {
  page.runtimeErrors = [];
  page.on("pageerror", (error) => page.runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("i18n_redirected", "en");
  });
});

test.afterEach(async ({ page }) => {
  expect(page.runtimeErrors).toEqual([]);
});

const stub = async (page, name, body, onRequest) => {
  await page.route(`**/${name}`, async (route) => {
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

    if (onRequest) onRequest(request);
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ data: body }),
    });
  });
};

test("verifies a legacy PayPal subscription against the PayPal backend", async ({
  page,
}) => {
  let paypalRequest;
  let stripeCalls = 0;

  await stub(
    page,
    "checksubscriberstatus",
    {
      isValid: true,
      data: {
        subscriptionId: "I-XBCXVY6FXX47",
        status: "ACTIVE",
        email: "legacy@example.com",
        name: { given_name: "Legacy", surname: "Subscriber" },
        expirationTimestamp: new Date(Date.now() + 86400000 * 20).toISOString(),
      },
    },
    (request) => {
      paypalRequest = request;
    }
  );
  await stub(page, "verifySubscription", { isValid: false }, () => {
    stripeCalls += 1;
  });

  await page.goto("/subscribe");
  await page.getByLabel("Email Address").fill("legacy@example.com");
  await page.getByLabel("Subscription ID").fill("I-XBCXVY6FXX47");
  await page.getByRole("button", { name: "Verify Access" }).click();

  await expect(
    page.getByRole("heading", { name: /your subscription is active/i })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("I-XBCXVY6FXX47")).toBeVisible();

  // A PayPal id must not be sent to the Stripe backend, which cannot know it.
  expect(stripeCalls).toBe(0);
  const payload = paypalRequest.postDataJSON().data;
  expect(payload.subscriptionId).toBe("I-XBCXVY6FXX47");
  expect(payload.client_id).toBeTruthy();
  // Looking up by email instead would resolve a different subscription.
  expect(payload.email).toBeUndefined();
});

test("reports a cancelled PayPal subscription as not found", async ({
  page,
}) => {
  await stub(page, "checksubscriberstatus", { isValid: false, data: {} });

  await page.goto("/subscribe");
  await page.getByLabel("Email Address").fill("lapsed@example.com");
  await page.getByLabel("Subscription ID").fill("I-CANCELLED123");
  await page.getByRole("button", { name: "Verify Access" }).click();

  await expect(
    page.getByText(/subscription not found|could not be verified/i)
  ).toBeVisible({ timeout: 30_000 });
});
