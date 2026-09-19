const path = require("path");
const base = require("@playwright/test");

const EXAMPLE_CHAT = path.resolve(__dirname, "../../static/chat_example.txt");

/**
 * Analytics and remote config, which every page load reaches for and which no
 * test is about. Left alone they are a real round trip to Google on every
 * navigation — and one that answers 403 from localhost anyway.
 *
 * Stripe and the Firebase callables are not in here: those are the subject of
 * the payment tests, which stub them per test. Playwright matches the most
 * recently registered route first, so a test's stub always wins over this.
 */
const THIRD_PARTY = [
  "**://firebaseinstallations.googleapis.com/**",
  "**://firebaseremoteconfig.googleapis.com/**",
  "**://*.google-analytics.com/**",
  "**://www.googletagmanager.com/**",
  "**://firebase-settings.crashlytics.com/**",
];

const test = base.test.extend({
  page: async ({ page }, use) => {
    // Without this the suite reads whatever language the browser asks for.
    await page.addInitScript(() => {
      localStorage.setItem("i18n_redirected", "en");
    });
    for (const pattern of THIRD_PARTY) {
      await page.route(pattern, (route) => route.abort());
    }

    // An uncaught exception means the page is broken even when the thing the
    // test looked for happened to render. Every test checks for them.
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await use(page);

    base.expect(runtimeErrors).toEqual([]);
  },
});

const { expect } = base;

const CORS_PREFLIGHT = {
  status: 204,
  headers: {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
  },
};

/**
 * Answer a Firebase callable with a canned payload, preflight included.
 * Returns the calls it received, so a test can assert on what was sent —
 * and on what was never called.
 */
const stubCallable = async (page, name, body) => {
  const calls = [];
  await page.route(`**/${name}`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill(CORS_PREFLIGHT);
      return;
    }

    calls.push(request);
    await route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      // Callables wrap their result in `data`, and so do these payloads.
      body: JSON.stringify({ data: body }),
    });
  });
  return calls;
};

/**
 * Answer a Firebase callable the way a failing backend does, so a test can
 * check what the customer is shown when it does.
 */
const stubCallableFailure = async (page, name, message) => {
  await page.route(`**/${name}`, async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill(CORS_PREFLIGHT);
      return;
    }

    await route.fulfill({
      status: 500,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ error: { status: "INTERNAL", message } }),
    });
  });
};

/** The Stripe Checkout page, served by us, so no test leaves the machine. */
const STRIPE_CHECKOUT = "https://checkout.stripe.test/c/pay/cs_test_session";

/**
 * Hand back a checkout URL we serve ourselves. Returns the calls, so a test
 * can check the price and mode the client asked to be charged.
 */
const stubStripeCheckout = async (page, url = STRIPE_CHECKOUT) => {
  const calls = await stubCallable(page, "createCheckoutSession", { url });
  await page.route("https://checkout.stripe.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "Stripe Checkout Mock" })
  );
  return calls;
};

/** What Stripe reports for a checkout the buyer completed. */
const paidSession = {
  mode: "payment",
  payment_status: "paid",
  customer_details: { email: "buyer@example.com" },
};

/** An active subscription, as verifySubscription reports it. */
const activeSubscription = (overrides = {}) => ({
  isValid: true,
  customerName: "Alex Developer",
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  customerId: "cus_12345",
  ...overrides,
});

/** Upload a chat and wait until the analysis is on screen. */
const analyzeChat = async (page, file = EXAMPLE_CHAT) => {
  await page.locator("#uploadmytextfile").setInputFiles(file);
  await expect(page.getByText("Chat Timeline", { exact: true })).toBeVisible();
  // `toBeVisible` passes on a fully transparent element, so it says nothing
  // about whether the analysis was painted. A reveal animation that never
  // fires leaves the whole thing at opacity 0 and every assertion above
  // still green.
  await expect(page.locator("#results .landing-reveal")).toHaveCSS(
    "opacity",
    "1"
  );
};

/** A second export, so the paid chat and the new one are clearly different. */
const otherChatFile = () => {
  const lines = [
    "1/2/21, 09:00 - Messages and calls are end-to-end encrypted.",
  ];
  for (let i = 0; i < 40; i++) {
    const author = i % 2 ? "Alice Smith" : "Bob Jones";
    lines.push(
      `1/${2 + (i % 20)}/21, ${9 + (i % 10)}:15 - ${author}: message ${i} 🎉`
    );
  }
  return {
    name: "other_chat.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(lines.join("\n"), "utf-8"),
  };
};

module.exports = {
  EXAMPLE_CHAT,
  STRIPE_CHECKOUT,
  activeSubscription,
  analyzeChat,
  expect,
  otherChatFile,
  paidSession,
  stubCallable,
  stubCallableFailure,
  stubStripeCheckout,
  test,
};
