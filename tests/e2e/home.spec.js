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
  ).toBeVisible();
  await expect(page.locator("#uploadmytextfile")).toBeAttached();
});

test("analyzes the example chat without uploading its contents", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (request) => requests.push(request));

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
});

test("switches to a localized route", async ({ page }) => {
  await page.getByLabel("Select language").selectOption("de");

  await expect(page).toHaveURL(/\/de\/?$/);
  await expect(
    page.getByText("Analysiere dein WhatsApp Chat in Sekunden", { exact: true })
  ).toBeVisible();
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
  ).toBeVisible();
});
