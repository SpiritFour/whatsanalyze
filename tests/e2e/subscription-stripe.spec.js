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

    // The reduced first month is a server-side coupon on the full price, so
    // the client must ask for the full subscription price, never a cheaper one.
    const checkoutPayload = checkoutRequest.postDataJSON().data;
    expect(checkoutPayload.mode).toBe("subscription");
    expect(checkoutPayload.priceId).toBe("price_1Sc6u074KJ57kF2wxb5cnIZL");
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

  test("keeps a verified subscription across a reload", async ({ page }) => {
    let verifyCalls = 0;
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

      verifyCalls += 1;
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

    // Straight to /subscribe without the credentials in the URL: the stored
    // subscription has to carry access on its own.
    await page.goto("/subscribe");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible({ timeout: 30_000 });
    expect(verifyCalls).toBe(1);
  });

  test("stays logged out after logging out", async ({ page }) => {
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
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/subscribe?email=test@example.com&token=sub_test123");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible({ timeout: 30_000 });

    // The subscription id has no spaces to wrap at, and used to run over the
    // columns beside it.
    const boxes = await Promise.all(
      [0, 1, 2].map((index) =>
        page.locator(".meta-item").nth(index).boundingBox()
      )
    );
    const overlaps = (a, b) =>
      a.x < b.x + b.width &&
      b.x < a.x + a.width &&
      a.y < b.y + b.height &&
      b.y < a.y + a.height;
    expect(overlaps(boxes[0], boxes[1])).toBe(false);
    expect(overlaps(boxes[0], boxes[2])).toBe(false);
    expect(overlaps(boxes[1], boxes[2])).toBe(false);

    await page.getByRole("button", { name: /logout/i }).click();
    await expect(
      page.getByRole("heading", { name: /restore or verify existing access/i })
    ).toBeVisible({ timeout: 30_000 });

    // Logging out has to outlive the reload: the stored copy is written on a
    // later tick, and navigating away used to beat it.
    await page.goto("/subscribe");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toHaveCount(0);
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
