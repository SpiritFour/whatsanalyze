const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    // The built site precaches ~10 MB into a service worker. It has nothing to
    // do with what these tests check, and it would answer them from its own
    // cache instead of from the build under test.
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    // A second run of the whole suite on a phone tells us almost nothing the
    // first one did not: the same code, the same stubs, the same answers. Only
    // the tests that are about the layout run here.
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      grep: /@mobile/,
    },
  ],
  webServer: {
    // The site is a static SPA, so serve the build rather than `nuxt dev`.
    // `nuxt dev` compiles each route the first time it is asked for, which cost
    // this suite minutes of waiting and forced every assertion to allow for it.
    // Building once is quicker than that, and it tests what actually ships.
    command: "pnpm build:e2e && pnpm serve:e2e",
    url: "http://localhost:4173",
    // Port 4173 keeps this clear of a `pnpm dev` on 3000, so an already-running
    // preview server is reused and only a stale one has to be restarted.
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
