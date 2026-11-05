const {
  EXAMPLE_CHAT,
  expect,
  stubCallable,
  stubCallableFailure,
  test,
} = require("./fixtures");

/**
 * After a free cloud preview the coach is there too, on a few free cloud
 * replies a day, sent without subscriber credentials. Every call is stubbed.
 */

const item = (title) => ({ title, description: `${title} in detail` });

async function previewReport(page) {
  await stubCallable(page, "analyzeChatAi", {
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
  });
  await page.goto("/tools/ai-chat-analyzer/");
  await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
  await page.getByRole("button", { name: "Get my free AI preview" }).click();
  const report = page.locator("#ai-report");
  await expect(
    report.getByText("Weekend plans", { exact: true }),
  ).toBeVisible();
  return report;
}

test.describe("free coach replies after a preview", () => {
  test("answers for free and says how many replies are left", async ({
    page,
  }) => {
    const report = await previewReport(page);
    const coach = report.locator(".coach");
    await expect(coach).toBeVisible();
    await expect(coach).toContainText("a few cloud replies a day");

    const calls = await stubCallable(page, "coachChatAi", {
      reply: "Ask Person A about the trip they keep mentioning.",
      remaining: 2,
      limit: 3,
      free: true,
    });
    await coach.locator(".coach__input").fill("What should I bring up?");
    await coach.getByRole("button", { name: "Send" }).click();

    await expect(coach).toContainText("the trip they keep mentioning");
    await expect(coach).toContainText("2 free cloud replies left today");
    // A free reply carries no subscriber credentials.
    const sent = JSON.parse(calls[0].postData()).data;
    expect(sent.email).toBeUndefined();
    expect(sent.subscriptionId).toBeUndefined();
  });

  test("says when today's free replies are used up", async ({ page }) => {
    const report = await previewReport(page);
    await stubCallableFailure(page, "coachChatAi", "coach_free_used", {
      status: 429,
      code: "RESOURCE_EXHAUSTED",
    });
    const coach = report.locator(".coach");
    await coach.locator(".coach__input").fill("What should I bring up?");
    await coach.getByRole("button", { name: "Send" }).click();
    await expect(coach.getByRole("alert")).toContainText(
      "used today's free replies",
    );
  });
});

test("from What should I reply?, the coach starts on reply help", async ({
  page,
}) => {
  await stubCallable(page, "analyzeChatAi", {
    insights: {
      answer: "",
      summary: "Two friends planning trips.",
      vibe: "Travel buddies",
      people: [{ name: "Person A", role: "Planner", style: "Long messages" }],
      dynamics: [],
      topics: [],
      highlights: [],
    },
    locked: { people: 1, dynamics: 0, topics: 0, highlights: 0 },
  });
  await page.goto("/tools/ai-chat-analyzer/?ask=better&coach=reply");
  await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
  await page.getByRole("button", { name: "Get my free AI preview" }).click();
  const coach = page.locator(".coach");
  await expect(coach.locator(".chip--on")).toHaveText("Help me reply");
  await expect(coach).toBeInViewport();
});
