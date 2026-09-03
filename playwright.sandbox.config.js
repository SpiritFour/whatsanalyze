const fs = require("node:fs");
const path = require("node:path");
const { defineConfig, devices } = require("@playwright/test");

// Integration suite against the real PayPal sandbox, run explicitly with
// `pnpm test:e2e:sandbox`. It boots the Firebase Functions emulator plus the
// dev server and exercises the subscription endpoints for real. It never logs
// in as a PayPal buyer; approval stays a manual step.
//
// The emulator reads PAYPAL_PASSWORD_DEV from `functions/.secret.local`.
// Without that file it falls back to Google Secret Manager, which only works
// when the Firebase CLI is logged in.
if (!fs.existsSync(path.join(__dirname, "functions", ".secret.local"))) {
  console.warn(
    "functions/.secret.local not found; the Functions emulator will try to " +
      "load PAYPAL_PASSWORD_DEV from Google Secret Manager (requires " +
      "`firebase login`)."
  );
}

module.exports = defineConfig({
  testDir: "./tests/e2e-sandbox",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
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
  ],
  webServer: [
    {
      // TMPDIR must stay short: macOS truncates unix-socket paths at ~104
      // chars, and the emulator's per-worker sockets (unique suffix last) live
      // under TMPDIR. With a long TMPDIR they collide after truncation and
      // every request executes whichever function's worker booted first.
      command:
        "TMPDIR=/tmp pnpm exec firebase emulators:start --only functions",
      // The emulator hub reports readiness; the functions emulator itself
      // answers requests only with a POST body, which the readiness probe
      // cannot send.
      url: "http://127.0.0.1:4400/emulators",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "pnpm dev-with-functions",
      url: "https://localhost:3000",
      ignoreHTTPSErrors: true,
      // Never reuse a `pnpm dev` server that is not pointed at the emulator.
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
