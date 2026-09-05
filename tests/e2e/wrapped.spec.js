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

test("renders the wrapped landing page", async ({ page }) => {
  await page.goto("/wrapped");
  await expect(page).toHaveTitle(/WhatsApp Wrapped/);
  await expect(page.locator("label[for='dropzone-file']")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByText("Your Chat, Told Like a Story", { exact: false })
  ).toBeVisible();
});

test("home page banner links to /wrapped", async ({ page }) => {
  await page.goto("/");
  const wrappedButton = page.locator("a[href='/wrapped']").first();
  await expect(wrappedButton).toBeVisible({ timeout: 20_000 });
});

test("renders the story carousel on /wrapped/results", async ({ page }) => {
  await page.goto("/wrapped/results");
  await expect(page.locator(".wrapped-scope")).toBeVisible({ timeout: 20_000 });
});
