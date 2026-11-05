const { EXAMPLE_CHAT, expect, stubCallable, test } = require("./fixtures");

/**
 * A link that picks the AI's question (?ask=, from the analyzer's "Ask AI"
 * card and the situation pages) has to survive the prerendered page's
 * hydration, and the question has to reach the AI.
 */
test("a question picked by the link is chosen and sent", async ({ page }) => {
  const calls = await stubCallable(page, "analyzeChatAi", {
    insights: {
      answer: "Say what you need before it turns into a fight.",
      summary: "Two friends planning trips.",
      vibe: "Travel buddies",
      people: [{ name: "Person A", role: "Planner", style: "Long messages" }],
      dynamics: [],
      topics: [],
      highlights: [],
    },
    locked: { people: 1, dynamics: 0, topics: 0, highlights: 0 },
  });

  await page.goto("/tools/ai-chat-analyzer/?ask=better");
  await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
  await expect(
    page.locator(".chip--on", { hasText: "How could we communicate better?" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Get my free AI preview" }).click();
  await expect(page.locator(".report-answer")).toContainText(
    "before it turns into a fight",
  );
  const sent = JSON.parse(calls[0].postData()).data;
  expect(sent.ask.question).toBe("How could we communicate better?");
});
