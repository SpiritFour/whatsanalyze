const { EXAMPLE_CHAT, expect, stubCallable, test } = require("./fixtures");

/**
 * "What should the AI know?": background the chat doesn't show ("she's my
 * sister", "we broke up in July"). It goes to the AI anonymized like the
 * chat, with the reading and with every coach turn after it, and analytics
 * only ever hear that there was some. Every call is stubbed.
 */

const item = (title) => ({ title, description: `${title} in detail` });

const PREVIEW = {
  insights: {
    answer: "",
    summary: "Two friends planning trips.",
    vibe: "Travel buddies",
    people: [{ name: "Person A", role: "Planner", style: "Long messages" }],
    dynamics: [item("Quick replies")],
    topics: [item("Weekend plans")],
    highlights: ["The lost passport"],
  },
  locked: { people: 1, dynamics: 2, topics: 3, highlights: 2 },
};

// The example chat is Jane Doe and John Doe.
const TYPED =
  "Jane is my sister. We fell out in July, reach her on +49 170 1234567.";
const SENT =
  /^Person [AB] is my sister\. We fell out in July, reach her on \[phone\]\.$/;

/** The AI events the page tracked, as GA4 would get them. */
const aiEvents = (page, name) =>
  page.evaluate(
    (name) =>
      (window.dataLayer ?? [])
        .filter((entry) => entry[0] === "event" && entry[1] === name)
        .map((entry) => entry[2]),
    name,
  );

test("the background goes to the AI anonymized, and to the coach after it", async ({
  page,
}) => {
  const aiCalls = await stubCallable(page, "analyzeChatAi", PREVIEW);
  await page.goto("/tools/ai-chat-analyzer/");
  await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
  await expect(page.locator("#ai-choose")).toBeVisible();

  const box = page.getByLabel("What should the AI know?");
  await expect(box).toBeVisible();
  await expect(box).toHaveAttribute("maxlength", "500");
  await box.fill(TYPED);

  // "Exactly what the cloud would receive" shows it as it will be sent.
  await page
    .locator(".sent-preview summary", {
      hasText: "See exactly what the cloud AI would receive",
    })
    .click();
  const preview = page.locator(".sent-preview pre");
  await expect(preview).toContainText('"background": "Person');
  await expect(preview).toContainText("[phone]");
  await expect(preview).not.toContainText("Jane is my sister");

  await page.getByRole("button", { name: "Get my free AI preview" }).click();
  const report = page.locator("#ai-report");
  await expect(
    report.getByText("Weekend plans", { exact: true }),
  ).toBeVisible();

  expect(aiCalls).toHaveLength(1);
  const { ask } = JSON.parse(aiCalls[0].postData()).data;
  expect(ask.background).toMatch(SENT);
  // The callable SDK sends a field left undefined as null.
  expect(ask.question ?? null).toBeNull();
  expect(JSON.stringify(ask)).not.toContain("Jane");
  expect(JSON.stringify(ask)).not.toContain("1234567");

  // The coach is told the same background, the same way.
  const coachCalls = await stubCallable(page, "coachChatAi", {
    reply: "Ask Person A how the move went.",
    remaining: 2,
    limit: 3,
    free: true,
  });
  const coach = report.locator(".coach");
  await coach.locator(".coach__input").fill("How do I start talking again?");
  await coach.getByRole("button", { name: "Send" }).click();
  await expect(coach).toContainText("how the move went");
  const sent = JSON.parse(coachCalls[0].postData()).data;
  expect(sent.background).toBe(ask.background);

  // Analytics hear that there was a background, never what it said.
  const [started] = await aiEvents(page, "ai_analysis_started");
  expect(started.ai_background).toBe(true);
  const [message] = await aiEvents(page, "ai_coach_message");
  expect(message.ai_background).toBe(true);
  const tracked = JSON.stringify(
    await page.evaluate(() =>
      (window.dataLayer ?? []).map((entry) => Array.from(entry ?? [])),
    ),
  );
  expect(tracked).not.toContain("sister");
});

test("left empty, nothing extra is sent", async ({ page }) => {
  const aiCalls = await stubCallable(page, "analyzeChatAi", PREVIEW);
  await page.goto("/tools/ai-chat-analyzer/");
  await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
  await page.getByLabel("What should the AI know?").fill("   ");
  await page.getByRole("button", { name: "Get my free AI preview" }).click();
  await expect(
    page.locator("#ai-report").getByText("Weekend plans", { exact: true }),
  ).toBeVisible();

  const { ask } = JSON.parse(aiCalls[0].postData()).data;
  expect(ask?.background ?? null).toBeNull();
  const [started] = await aiEvents(page, "ai_analysis_started");
  expect(started.ai_background).toBe(false);
});

test("the sample chat has no box: its readings were made without one", async ({
  page,
}) => {
  await page.goto("/tools/ai-chat-analyzer/");
  await page.getByRole("button", { name: "Try With Sample Chat" }).click();
  await expect(page.locator("#ai-choose")).toBeVisible();
  await expect(page.getByLabel("What should the AI know?")).toHaveCount(0);
});

test("the box fits a phone screen @mobile", async ({ page }) => {
  await page.goto("/tools/ai-chat-analyzer/");
  await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
  const box = page.getByLabel("What should the AI know?");
  await box.scrollIntoViewIfNeeded();
  await expect(box).toBeVisible();
  const { width } = await box.boundingBox();
  const viewport = page.viewportSize();
  expect(width).toBeLessThanOrEqual(viewport.width);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
