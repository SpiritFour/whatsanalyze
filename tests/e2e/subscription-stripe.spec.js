const { expect, test } = require("@playwright/test");

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

test.describe("Stripe subscription and verification flow", () => {
  test("subscribing from wrapped redirects to Stripe checkout session", async ({
    page,
  }) => {
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
          data: { url: "https://checkout.stripe.test/c/pay/cs_test_123" },
        }),
      });
    });

    await page.route("https://checkout.stripe.test/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "Stripe Checkout Mock" })
    );

    await page.goto("/wrapped");

    const unlockButton = page.getByRole("button", {
      name: /upgrade to pro/i,
    });
    await expect(unlockButton).toBeVisible();
    await unlockButton.click();
    await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.test\//);
    expect(checkoutRequest).toBeTruthy();
  });

  test("verifies an active Stripe subscription on unified /subscribe", async ({
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
            customerName: "Alex Developer",
            expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
            customerId: "cus_12345",
          },
        }),
      });
    });

    await page.goto("/subscribe?email=test@example.com&token=sub_test123");

    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByText("sub_test123")).toBeVisible();
  });

  test("shows error when subscription verification fails", async ({ page }) => {
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
            isValid: false,
            message: "Subscription has expired",
          },
        }),
      });
    });

    await page.goto(
      "/subscribe?email=expired@example.com&token=sub_expired123"
    );

    await expect(
      page.getByText(
        /subscription has expired|subscription could not be verified/i
      )
    ).toBeVisible({ timeout: 15_000 });
  });
});
