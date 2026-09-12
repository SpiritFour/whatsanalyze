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

/** Answer the checkout call with a Stripe page we serve ourselves. */
const stubCreateCheckoutSession = async (page) => {
  await page.route("**/createCheckoutSession", async (route) => {
    if (route.request().method() === "OPTIONS") {
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
        data: { url: "https://checkout.stripe.test/c/pay/cs_test_paid" },
      }),
    });
  });
  await page.route("https://checkout.stripe.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "Stripe Checkout Mock" })
  );
};

/** Walk through the paywall the way a buyer does, up to leaving for Stripe. */
const startOneTimeCheckout = async (page) => {
  await page
    .getByRole("button", { name: "Download full chat PDF" })
    .first()
    .click();
  await page.getByRole("button", { name: "Buy Now" }).click();
  await page.waitForURL("https://checkout.stripe.test/**");
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
  await stubCheckoutSession(page, {
    mode: "payment",
    payment_status: "paid",
    customer_details: { email: "buyer@example.com" },
  });
  await stubCreateCheckoutSession(page);

  await page.goto("/");
  await page.locator("#uploadmytextfile").setInputFiles(exampleChat);
  await expect(page.getByText("Chat Timeline", { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  // Buy through the paywall, so the purchase is tied to the chat on screen.
  await startOneTimeCheckout(page);

  const downloadPromise = page.waitForEvent("download", { timeout: 90_000 });
  await page.goto("/?session_id=cs_test_paid&payment_success=true");
  await downloadPromise;

  // A single payment buys the PDF of one chat. The next upload is a new chat,
  // and has to be paid for.
  await page.locator("#uploadmytextfile").setInputFiles(otherChatFile());
  await expect(page.getByText("Choose Your Plan")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Your full chat PDF is paid for")).toBeVisible();
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
