const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  fullyParallel: true,
  // CI runners are small; chart rendering and PDF-worker tests exceed
  // Playwright's 30s default there.
  timeout: process.env.CI ? 120_000 : 30_000,
  // First visits compile pages on the fly in `nuxt dev`, which can exceed the
  // 5s default assertion timeout on slow machines.
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "https://localhost:3000",
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "https://localhost:3000",
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
