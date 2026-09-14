/**
 * Getting into an existing subscription and staying in it: verification
 * through Stripe, through PayPal for the customers who subscribed before the
 * move, and logging back out.
 */
const {
  activeSubscription,
  expect,
  stubCallable,
  test,
} = require("./fixtures");

test.describe("verifying a Stripe subscription", () => {
  test("activates it from the link in the email", async ({ page }) => {
    await stubCallable(page, "verifySubscription", activeSubscription());

    await page.goto("/subscribe?email=test@example.com&token=sub_test123");

    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByText("sub_test123")).toBeVisible();
  });

  test("activates it from a fresh checkout, which names the subscription", async ({
    page,
  }) => {
    await stubCallable(
      page,
      "verifySubscription",
      activeSubscription({ customerName: "Sam Subscriber" })
    );

    await page.goto(
      "/subscribe?email=sam@example.com&subscription_id=sub_test_home"
    );

    await expect(
      page.getByRole("heading", { name: "Your subscription is Active" })
    ).toBeVisible();
    await expect(page.getByText("sub_test_home")).toBeVisible();
  });

  test("keeps it across a reload without asking the backend again", async ({
    page,
  }) => {
    const calls = await stubCallable(
      page,
      "verifySubscription",
      activeSubscription()
    );

    await page.goto("/subscribe?email=test@example.com&token=sub_test123");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible();

    // Straight to /subscribe without the credentials in the URL: the stored
    // subscription has to carry access on its own.
    await page.goto("/subscribe");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible();
    expect(calls).toHaveLength(1);
  });

  test("stays logged out after logging out", async ({ page }) => {
    await stubCallable(page, "verifySubscription", activeSubscription());
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/subscribe?email=test@example.com&token=sub_test123");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /logout/i }).click();
    await expect(
      page.getByRole("heading", { name: /restore or verify existing access/i })
    ).toBeVisible();

    // Logging out has to outlive the reload: the stored copy is written on a
    // later tick, and navigating away used to beat it.
    await page.goto("/subscribe");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toHaveCount(0);
  });

  test("reports an expired subscription instead of letting it in", async ({
    page,
  }) => {
    await stubCallable(page, "verifySubscription", {
      isValid: false,
      message: "Subscription has expired",
    });

    await page.goto(
      "/subscribe?email=expired@example.com&token=sub_expired123"
    );

    await expect(
      page.getByText(
        /subscription has expired|subscription could not be verified/i
      )
    ).toBeVisible();
  });

  // The subscription id has no spaces to wrap at, and used to run over the
  // columns beside it — which only shows up where the columns are narrow.
  test("lays the subscription details out without overlap @mobile", async ({
    page,
  }) => {
    await stubCallable(page, "verifySubscription", activeSubscription());

    await page.goto("/subscribe?email=test@example.com&token=sub_test123");
    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible();

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
  });
});

// Customers who subscribed before the move to Stripe still log in on the same
// page with their PayPal subscription id. Those subscriptions live in the old
// project and are unknown to verifySubscription.
test.describe("verifying a legacy PayPal subscription", () => {
  const logIn = async (page, email, subscriptionId) => {
    await page.goto("/subscribe");
    await page.getByLabel("Email Address").fill(email);
    await page.getByLabel("Subscription ID").fill(subscriptionId);
    await page.getByRole("button", { name: "Verify Access" }).click();
  };

  test("checks it against PayPal, never against Stripe", async ({ page }) => {
    const paypalCalls = await stubCallable(page, "checksubscriberstatus", {
      isValid: true,
      data: {
        subscriptionId: "I-XBCXVY6FXX47",
        status: "ACTIVE",
        email: "legacy@example.com",
        name: { given_name: "Legacy", surname: "Subscriber" },
        expirationTimestamp: new Date(Date.now() + 20 * 86400000).toISOString(),
      },
    });
    const stripeCalls = await stubCallable(page, "verifySubscription", {
      isValid: false,
    });

    await logIn(page, "legacy@example.com", "I-XBCXVY6FXX47");

    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible();
    await expect(page.getByText("I-XBCXVY6FXX47")).toBeVisible();

    // A PayPal id must not be sent to the Stripe backend, which cannot know it.
    expect(stripeCalls).toHaveLength(0);
    const payload = paypalCalls[0].postDataJSON().data;
    expect(payload.subscriptionId).toBe("I-XBCXVY6FXX47");
    expect(payload.client_id).toBeTruthy();
    // Looking up by email instead would resolve a different subscription.
    expect(payload.email).toBeUndefined();
  });

  test("reports a cancelled one as not found", async ({ page }) => {
    await stubCallable(page, "checksubscriberstatus", {
      isValid: false,
      data: {},
    });

    await logIn(page, "lapsed@example.com", "I-CANCELLED123");

    await expect(
      page.getByText(/subscription not found|could not be verified/i)
    ).toBeVisible();
  });
});
