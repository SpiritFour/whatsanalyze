const { expect, test } = require("@playwright/test");

// These tests talk to the real PayPal sandbox through the Firebase Functions
// emulator. They create genuine (unapproved) sandbox subscriptions. The buyer
// approval on paypal.com is intentionally not automated: it requires a buyer
// login, and PayPal's bot detection makes that unreliable in CI.

const functionsBaseUrl = "http://127.0.0.1:5001/whatsanalyze-80665/us-central1";
// Public sandbox client id, same value as `paypalClientId` in nuxt.config.js.
const sandboxClientId =
  "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec";

test("subscribing redirects to a real PayPal sandbox approval page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("i18n_redirected", "en");
  });
  await page.goto("/subscribe");

  await page.getByRole("button", { name: "Subscribe Now" }).click();

  // "commit" is enough: reaching PayPal's URL proves the subscription was
  // created, and fully loading PayPal's heavy page adds only flakiness.
  await page.waitForURL(/^https:\/\/www\.sandbox\.paypal\.com\//, {
    waitUntil: "commit",
    timeout: 90_000,
  });
  const approvalUrl = new URL(page.url());
  expect(approvalUrl.searchParams.get("ba_token")).toMatch(/^BA-/);
});

test("a fresh subscription verifies as pending, not active", async ({
  request,
}) => {
  const created = await request.post(`${functionsBaseUrl}/helloworld`, {
    headers: { origin: "https://localhost:3000" },
    data: { data: { client_id: sandboxClientId } },
  });
  expect(created.ok()).toBe(true);
  const { data: subscription } = await created.json();
  expect(subscription.approveLink).toContain("sandbox.paypal.com");
  expect(subscription.subscriptionId).toMatch(/^I-/);

  // The same check the /subscribe return flow runs, against PayPal's live
  // subscription state. Without buyer approval it must stay APPROVAL_PENDING
  // and must not grant access.
  const status = await request.post(
    `${functionsBaseUrl}/checksubscriberstatus`,
    {
      data: {
        data: {
          client_id: sandboxClientId,
          subscriptionId: subscription.subscriptionId,
        },
      },
    }
  );
  expect(status.ok()).toBe(true);
  const { data: verification } = await status.json();
  expect(verification.isValid).toBe(false);
  expect(verification.data.status).toBe("APPROVAL_PENDING");
  expect(verification.data.subscriptionId).toBe(subscription.subscriptionId);
});
