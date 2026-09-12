const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  fullyParallel: true,
  // Rendering every chart and building a PDF in a worker takes the better part
  // of a minute whenever the machine is busy — on a small CI runner, and just
  // as much locally with the suite running in parallel.
  timeout: 120_000,
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
    // Compiles every route once, so no test has to wait for `nuxt dev`.
    {
      name: "warmup",
      testMatch: /warmup\.setup\.js/,
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /warmup\.setup\.js/,
      dependencies: ["warmup"],
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
      testIgnore: /warmup\.setup\.js/,
      dependencies: ["warmup"],
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
