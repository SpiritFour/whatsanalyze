/**
 * Paying for the full chat PDF, and what that payment does and does not
 * unlock. Everything Stripe is stubbed: no test leaves the machine, and the
 * assertions are about what the client asks to be charged and what it hands
 * over afterwards.
 */
const {
  STRIPE_CHECKOUT,
  analyzeChat,
  expect,
  otherChatFile,
  paidSession,
  stubCallable,
  stubStripeCheckout,
  test,
} = require("./fixtures");

/** Walk through the paywall the way a buyer does, up to leaving for Stripe. */
const startOneTimeCheckout = async (page) => {
  await page
    .getByRole("button", { name: "Download full chat PDF" })
    .first()
    .click();
  await page.getByRole("button", { name: "Buy Now" }).click();
  await page.waitForURL("https://checkout.stripe.test/**");
};

/** Come back from Stripe the way a buyer does, with the session in the URL. */
const returnFromCheckout = (page, sessionId) =>
  page.goto(`/?session_id=${sessionId}&payment_success=true`);

/**
 * The full PDF has to be out of reach: no download button anywhere, and the
 * paywall offering to buy instead. Checking only that the pricing table is
 * back would pass while a download button sat right next to it.
 */
const expectPaywall = async (page) => {
  await expect(page.getByText("Choose Your Plan")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Download now$/i })
  ).toHaveCount(0);

  await page
    .getByRole("button", { name: /Download full chat PDF/i })
    .first()
    .click();
  await expect(page.getByRole("button", { name: /Buy Now/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Download now$/i })
  ).toHaveCount(0);
};

test.describe("buying the full PDF once", () => {
  test("asks Stripe to charge the one-time price for the chat on screen", async ({
    page,
  }) => {
    const checkout = await stubStripeCheckout(page);

    await page.goto("/");
    await analyzeChat(page);

    await page
      .getByRole("button", { name: /Download full chat PDF/i })
      .first()
      .click();
    await expect(page.getByText("Nice!!", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Buy Now \(€7\.99\)/i }).click();

    await expect(page).toHaveURL(STRIPE_CHECKOUT);
    const payload = checkout[0].postDataJSON().data;
    expect(payload.mode).toBe("payment");
    expect(payload.priceId).toBeTruthy();
  });

  test("delivers the full PDF on the way back from a paid checkout", async ({
    page,
  }) => {
    await stubCallable(page, "getCheckoutSession", paidSession);
    await stubStripeCheckout(page);

    // Analyze a chat first: that is what the one-time payment buys, and it has
    // to survive the redirect to Stripe and back.
    await page.goto("/");
    await analyzeChat(page);
    await startOneTimeCheckout(page);

    const downloadPromise = page.waitForEvent("download");
    await returnFromCheckout(page, "cs_test_paid");

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

    // Stripe drops the buyer at the top of a long page — they should be looking
    // at the download section they paid for, not at the hero.
    await expect(page.locator("#payButton")).toBeInViewport();

    // The proof of payment must not stay in the URL, where a reload or a shared
    // link would replay it.
    await expect(page).toHaveURL(/\/$/);

    // The full PDF stays unlocked for the session instead of showing the
    // pricing table again.
    await expect(page.getByText("Choose Your Plan")).toHaveCount(0);
  });

  test("locks the full PDF again when a different chat is uploaded", async ({
    page,
  }) => {
    await stubCallable(page, "getCheckoutSession", paidSession);
    await stubStripeCheckout(page);

    await page.goto("/");
    await analyzeChat(page);
    // Buy through the paywall, so the purchase is tied to the chat on screen.
    await startOneTimeCheckout(page);

    const downloadPromise = page.waitForEvent("download");
    await returnFromCheckout(page, "cs_test_paid");
    await downloadPromise;

    // A single payment buys the PDF of one chat. The next upload is a new chat,
    // and has to be paid for.
    await analyzeChat(page, otherChatFile());
    await expectPaywall(page);
    await expect(
      page.getByText("Your full chat PDF is paid for")
    ).toBeVisible();
  });

  test("keeps the paywall closed for a purchase that names no chat", async ({
    page,
  }) => {
    // What a browser is left with after paying on a build that did not record
    // the chat yet. It must not unlock whatever chat is opened next.
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "whatsanalyze_one_time_purchase",
        JSON.stringify({ sessionId: "cs_test_without_chat" })
      );
    });

    await page.goto("/");
    await analyzeChat(page);

    await expectPaywall(page);
  });

  test("keeps the paywall closed when the checkout session was not paid", async ({
    page,
  }) => {
    await stubCallable(page, "getCheckoutSession", {
      ...paidSession,
      payment_status: "unpaid",
    });

    await page.goto("/");
    await analyzeChat(page);
    await returnFromCheckout(page, "cs_test_unpaid");

    await expectPaywall(page);
  });
});

test.describe("starting a subscription", () => {
  test("charges the full subscription price from /wrapped", async ({
    page,
  }) => {
    const checkout = await stubStripeCheckout(page);

    await page.goto("/wrapped");
    await page.getByRole("button", { name: "Subscribe Now" }).click();

    await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.test\//);
    // The reduced first month is a server-side coupon on the full price, so
    // the client must ask for the full subscription price, never a cheaper one.
    const payload = checkout[0].postDataJSON().data;
    expect(payload.mode).toBe("subscription");
    expect(payload.priceId).toBe("price_1UGehh74KJ57kF2woEzDq1UR");
  });

  // Without them the backend falls back to /subscribe, and someone who paid
  // from inside Wrapped never sees the Wrapped success page.
  test("brings a subscriber who paid inside Wrapped back into Wrapped", async ({
    page,
  }) => {
    const checkout = await stubStripeCheckout(page);

    await page.goto("/wrapped");
    await page.getByRole("button", { name: "Subscribe Now" }).click();
    await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.test\//);

    const payload = checkout[0].postDataJSON().data;
    expect(payload.successUrl).toMatch(
      /\/wrapped\/subscription\/success\?session_id=\{CHECKOUT_SESSION_ID\}$/
    );
    expect(payload.cancelUrl).toMatch(/\/wrapped\/subscription\/canceled$/);
  });

  /**
   * Both entry points used to be `<component :is="'NuxtLink'">`, which ships a
   * literal `<NUXTLINK>` element: a CTA that looks right and goes nowhere. The
   * header nav was the only way left into the subscription from the analyzer.
   */
  test("reaches the subscription page from the analyzed chat", async ({
    page,
  }) => {
    await page.goto("/");
    await analyzeChat(page);

    // Nothing on the results may be one of those unclickable pseudo-elements.
    await expect(page.locator("nuxtlink")).toHaveCount(0);

    await page.getByRole("link", { name: "Subscribe Now" }).click();
    await page.waitForURL(/\/subscribe$/);
    await expect(
      page.getByRole("button", { name: "Subscribe Now" })
    ).toBeVisible();
  });

  test("reaches the subscription page from the paywall dialog", async ({
    page,
  }) => {
    await page.goto("/");
    await analyzeChat(page);

    await page
      .getByRole("button", { name: /Download full chat PDF/i })
      .first()
      .click();
    await page.getByRole("link", { name: /Open Subscription Page/i }).click();

    await page.waitForURL(/\/subscribe$/);
  });

  test("sends a subscriber from /subscribe to Stripe checkout", async ({
    page,
  }) => {
    const checkout = await stubStripeCheckout(page);

    await page.goto("/subscribe");
    await page.getByRole("button", { name: "Subscribe Now" }).click();

    await expect(page).toHaveURL(STRIPE_CHECKOUT);
    expect(checkout).toHaveLength(1);
  });

  // One action, one name. It used to be "Subscribe Now with Stripe" here,
  // "Subscribe Now" in the pricing table and "Upgrade to Pro" in Wrapped.
  test("calls starting a subscription the same thing everywhere", async ({
    page,
  }) => {
    for (const path of ["/subscribe", "/wrapped"]) {
      await page.goto(path);
      await expect(
        page.getByRole("button", { name: "Subscribe Now", exact: true })
      ).toBeVisible();
    }
  });
});

test.describe("quoting prices", () => {
  test("quotes what Stripe charges, in one format", async ({ page }) => {
    await page.goto("/");
    await analyzeChat(page);

    const prices = page.locator(".pricing-card__price");
    await expect(prices.nth(0)).toHaveText("€0");
    // One format throughout, and a badge computed from the two prices beside
    // it: 15 → 7.99 is 47% off, and claiming more is a price indication risk
    // in the EU.
    await expect(prices.nth(1)).toHaveText(/^€7\.99\s*-47%\s*€15$/);
    // The intro month is a flat 5 € off coupon on the monthly price, so the
    // two have to be quoted 5 € apart or checkout contradicts the table.
    await expect(prices.nth(2)).toHaveText("€4.99 First Month");
    await expect(page.locator(".pricing-card__was--block")).toHaveText(
      "then €9.99/month"
    );

    // No "7,99 Euro" next to "7.99 EUR" next to "€9.99/month".
    await expect(
      page.locator(".pricing-card").getByText(/EUR|Euro/)
    ).toHaveCount(0);
  });
});
