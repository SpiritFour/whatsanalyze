const path = require("path");
const { expect, test } = require("@playwright/test");

const exampleChat = path.resolve(__dirname, "../../static/chat_example.txt");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("i18n_redirected", "en");
  });
  await page.goto("/");
});

test("renders the analyzer landing page", async ({ page }) => {
  await expect(page).toHaveTitle(/WhatsAnalyze/);
  await expect(
    page.getByText("Analyze your WhatsApp Chat in Seconds", { exact: true })
  ).toBeVisible();
  await expect(page.locator("#uploadmytextfile")).toBeAttached();

  await page.addStyleTag({
    content: ".amcharts-chart-div { visibility: hidden !important; }",
  });
  await expect(page.locator(".top-color")).toHaveScreenshot(
    "analyzer-landing.png"
  );
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
});
