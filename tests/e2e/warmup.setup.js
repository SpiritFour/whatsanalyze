const path = require("path");
const { expect, test } = require("@playwright/test");

/**
 * `nuxt dev` compiles a route the first time it is requested, and the page
 * stays blank until that is done — on a cold cache the home page needs far
 * more than the seconds an assertion waits for. Whichever test went first paid
 * that bill and failed for it, which is not what it was testing. So we pay it
 * once, here, before any test runs.
 */
// Every route the suite visits: each page is a file of its own, and each one
// is compiled separately the first time it is asked for.
const ROUTES = [
  "/",
  "/wrapped",
  "/wrapped/results",
  "/subscribe",
  "/tools",
  "/tools/court-evidence",
  "/tools/proof-of-relationship",
  "/tools/inactivity",
  "/tools/message-counter",
  "/tools/word-counter",
  "/tools/chat-heatmap",
  "/how-to-export-your-whatsapp-chat",
];

const exampleChat = path.resolve(__dirname, "../../static/chat_example.txt");

test("warms up the dev server", async ({ page }) => {
  test.setTimeout(ROUTES.length * 120_000);

  for (const route of ROUTES) {
    await page.goto(route);
    // Nuxt only fills its root element once the route is compiled and hydrated.
    await expect(page.locator("#__nuxt > *").first()).toBeAttached({
      timeout: 120_000,
    });
  }

  // Visiting pages is not enough: the PDF is built in a web worker that is
  // only compiled once something asks for one. That happens in the middle of
  // the first test that downloads a PDF, where Vite pulls in the PDF
  // dependencies and reloads the page — taking the pending download with it.
  await page.goto("/");
  await page.locator("#uploadmytextfile").setInputFiles(exampleChat);
  await expect(page.getByText("Chat Timeline", { exact: true })).toBeVisible({
    timeout: 120_000,
  });

  const download = page
    .waitForEvent("download", { timeout: 180_000 })
    .catch(() => null);
  await page
    .getByRole("button", { name: /Download free preview PDF/i })
    .click();
  if (!(await download)) {
    // Not the warmup's job to assert this — the tests do, and they report it
    // far better than a setup failure would.
    console.log("warmup: no PDF arrived, the PDF tests will say why");
  }
});
