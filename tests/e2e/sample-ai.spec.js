const { EXAMPLE_CHAT, expect, stubCallable, test } = require("./fixtures");

/**
 * The sample chat's AI readings were made in advance (utils/ai/sample.ts):
 * trying the AI on it shows those after a wait, without a call to the cloud,
 * so it costs nothing and the visitor's free preview stays theirs.
 */

const reading = (answer) => ({
  answer,
  summary: "Emma and Leo, a year in.",
  vibe: "Warm, then strained",
  people: [
    { name: "Emma", role: "The one who reaches out", style: "Warm" },
    { name: "Leo", role: "The busy one", style: "Short replies" },
  ],
  dynamics: [{ title: "Plans that fall through", description: "Often." }],
  topics: [{ title: "Gerald the pigeon", description: "A running joke." }],
  highlights: ["Lisbon"],
});

// What static/sample/ai/en.json holds, with the sample chat's own numbers
// (scripts/sample-chat/generate.mjs) so the page takes it for the sample's.
const SAMPLE_READINGS = {
  chat: { messages: 2389, from: "2025-09-12", to: "2026-10-24" },
  model: "test",
  readings: {
    none: reading(""),
    better: reading("Say when you're running late, before it's late."),
    arguments: reading("Cancelled plans."),
    effort: reading("Emma, lately."),
    "into:Emma": reading("Yes, though he shows it less."),
    "into:Leo": reading("Yes."),
    "worried:Emma": reading("Leo has been pulling away since August."),
    "worried:Leo": reading("Emma feels like an afterthought."),
    "gift:Emma": reading("Something with Gerald on it."),
    "gift:Leo": reading("Pastéis de nata."),
  },
  coach: [
    {
      id: "plans",
      kind: "ask",
      me: null,
      prompt: "Why do our plans keep falling through?",
      reply: "Work keeps winning the last-minute decisions.",
    },
    {
      id: "breakup",
      kind: "reply",
      me: "Emma",
      prompt:
        "what is that supposed to mean?? if you want to break up just say it",
      reply: "Ok, tomorrow works. Honestly, this makes me nervous.",
    },
  ],
};

const openSample = async (page) => {
  await page.route("**/sample/ai/en.json", (route) =>
    route.fulfill({ json: SAMPLE_READINGS }),
  );
  const aiCalls = await stubCallable(page, "analyzeChatAi", {});
  const coachCalls = await stubCallable(page, "coachChatAi", {});
  await page.clock.install();
  await page.goto("/tools/ai-chat-analyzer/");
  await page.getByRole("button", { name: "Try With Sample Chat" }).click();
  await expect(page.locator("#ai-choose")).toBeVisible();
  return { aiCalls, coachCalls };
};

test("the sample's reading and coach come without asking the cloud", async ({
  page,
}) => {
  const { aiCalls, coachCalls } = await openSample(page);
  await expect(
    page.getByText("its AI readings were made in advance"),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "How could we communicate better?" })
    .click();
  await page.getByRole("button", { name: "Show the AI reading" }).click();
  await expect(
    page.getByText("The AI is reading the sample chat…"),
  ).toBeVisible();
  await page.clock.fastForward(10_000);

  const report = page.locator("#ai-report");
  await expect(
    report.getByText("Say when you're running late, before it's late."),
  ).toBeVisible();
  await expect(
    report.getByText("This is the sample chat's full reading"),
  ).toBeVisible();

  // The coach offers what it has answers for, not a box to type into.
  const coach = page.locator(".coach");
  await expect(coach.locator("textarea")).toHaveCount(0);
  await coach
    .getByRole("button", { name: "Why do our plans keep falling through?" })
    .click();
  await page.clock.fastForward(3_000);
  await expect(
    coach.getByText("Work keeps winning the last-minute decisions."),
  ).toBeVisible();

  await coach.getByRole("radio", { name: "Help me reply" }).click();
  await expect(coach.getByText("Draft from Emma")).toBeVisible();

  expect(aiCalls).toHaveLength(0);
  expect(coachCalls).toHaveLength(0);

  // Then their own chat, straight from the end of the sample's reading.
  await expect(
    page.getByText("Your turn: what would your chat say?"),
  ).toBeVisible();
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Choose my chat file" }).click(),
  ]);
  await chooser.setFiles(EXAMPLE_CHAT);
  await expect(
    page.getByRole("button", { name: "Get my free AI preview" }),
  ).toBeVisible();
  await expect(
    page.getByText("Your turn: what would your chat say?"),
  ).toHaveCount(0);
});

test("on the sample, each side gets its own reading", async ({ page }) => {
  await openSample(page);
  await page
    .getByRole("button", {
      name: "Is there anything I should be worried about?",
    })
    .click();
  const show = page.getByRole("button", { name: "Show the AI reading" });
  // Whose worries: asked first, as with any chat.
  await expect(show).toBeDisabled();
  await page
    .locator(".ask__chips")
    .getByRole("button", { name: "Emma" })
    .click();
  await show.click();
  await page.clock.fastForward(10_000);
  await expect(
    page.getByText("Leo has been pulling away since August."),
  ).toBeVisible();
});

test("a question of one's own needs one's own chat", async ({ page }) => {
  const { aiCalls } = await openSample(page);
  await page.getByRole("button", { name: "Ask your own question" }).click();
  await expect(
    page.getByText("Your own question needs your own chat."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show the AI reading" }),
  ).toBeDisabled();
  expect(aiCalls).toHaveLength(0);
});

test("a sample that can't load says so plainly", async ({ page }) => {
  // Offline, or the server gone: the browser's own "Load failed" told
  // nobody anything.
  await page.route("**/sample/chat.txt", (route) => route.abort());
  await page.goto("/tools/ai-chat-analyzer/");
  await page.getByRole("button", { name: "Try With Sample Chat" }).click();
  await expect(
    page.getByText(
      "Couldn't load the sample chat. Check your connection and try again.",
    ),
  ).toBeVisible();
});

test("the sample keeps its name after a reload", async ({ page }) => {
  await openSample(page);
  await page.reload();
  await expect(
    page.getByText("Sample WhatsApp Chat (Emma & Leo)"),
  ).toBeVisible();
});
