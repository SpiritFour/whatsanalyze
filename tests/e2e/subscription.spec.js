/**
 * Getting into an existing subscription and staying in it: verification
 * through Stripe, through PayPal for the customers who subscribed before the
 * move, and logging back out.
 */
const {
  activeSubscription,
  expect,
  stubCallable,
  stubCallableFailure,
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

  // The explanation used to sit below the pricing table, off screen. Someone
  // following the link in their renewal email saw an ordinary sales page with
  // no sign that anything had gone wrong.
  test("says why the link did not work without making them scroll", async ({
    page,
  }) => {
    await stubCallable(page, "verifySubscription", {
      isValid: false,
      message: "Subscription has expired",
    });

    await page.goto(
      "/subscribe?email=expired@example.com&token=sub_expired123"
    );

    await expect(page.getByText(/subscription has expired/i)).toBeInViewport();
  });

  // The session id is the proof of payment: a reload or a shared link would
  // replay it.
  test("drops the checkout session from the URL on the way in", async ({
    page,
  }) => {
    await stubCallable(page, "getCheckoutSession", {
      mode: "subscription",
      payment_status: "paid",
      subscription: "sub_from_checkout",
      customer_details: { email: "buyer@example.com" },
    });
    await stubCallable(page, "verifySubscription", activeSubscription());

    await page.goto("/subscribe?session_id=cs_test_subscription");

    await expect(
      page.getByRole("heading", { name: /your subscription is active/i })
    ).toBeVisible();
    await expect(page).not.toHaveURL(/session_id/);
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

/**
 * Where Stripe drops a subscriber who paid from inside Wrapped. Every way of
 * arriving here that is not a confirmed payment has to lead somewhere.
 */
test.describe("returning from a Wrapped checkout", () => {
  test("confirms the payment and offers the way on", async ({ page }) => {
    await stubCallable(page, "getCheckoutSession", {
      mode: "subscription",
      payment_status: "paid",
      subscription: "sub_wrapped",
      customer_details: { email: "buyer@example.com" },
    });
    await stubCallable(page, "verifySubscription", activeSubscription());

    await page.goto("/wrapped/subscription/success?session_id=cs_test_paid");

    await expect(
      page.getByRole("heading", { name: /payment successful/i })
    ).toBeVisible();
    await expect(page.getByText("sub_wrapped")).toBeVisible();
  });

  // Opened on its own it used to render a header, a footer, and nothing at all
  // in between.
  test("says something when there is no checkout to confirm", async ({
    page,
  }) => {
    await page.goto("/wrapped/subscription/success");

    await expect(
      page.getByRole("heading", { name: /nothing to confirm here/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /back to whatsapp wrapped/i })
    ).toBeVisible();
  });

  test("never hands the customer a raw Stripe error", async ({ page }) => {
    await stubCallableFailure(
      page,
      "getCheckoutSession",
      "No such checkout.session: cs_test_abc"
    );

    await page.goto("/wrapped/subscription/success?session_id=cs_test_abc");

    await expect(
      page.getByRole("heading", { name: /could not confirm your payment/i })
    ).toBeVisible();
    await expect(page.getByText(/No such checkout\.session/)).toHaveCount(0);

    // A dead end is what made this page a support ticket: there has to be a
    // retry, somewhere to go, and someone to ask.
    await expect(
      page.getByRole("button", { name: /try again/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /manage your subscription/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "info@whatsanalyze.com" })
    ).toBeVisible();
  });

  test("does not call an unpaid checkout a payment", async ({ page }) => {
    await stubCallable(page, "getCheckoutSession", {
      mode: "subscription",
      payment_status: "unpaid",
      customer_details: { email: "buyer@example.com" },
    });

    await page.goto("/wrapped/subscription/success?session_id=cs_test_unpaid");

    await expect(
      page.getByRole("heading", { name: /did not go through/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /payment successful/i })
    ).toHaveCount(0);
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
