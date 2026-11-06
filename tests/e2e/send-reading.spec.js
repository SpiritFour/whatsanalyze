const {
  EXAMPLE_CHAT,
  expect,
  gaEvents,
  stubCallable,
  stubShareStore,
  test,
} = require("./fixtures");

/**
 * "Send this to John Doe": a reading about the two people in a chat, sent to
 * the other one through WhatsApp as an encrypted link, who sees the same
 * reading and gets their own next (utils/ai/sendReading.js). Only readings
 * that don't take a side are offered: one about one side, landing in the
 * other person's chat, can start the argument it was meant to help with.
 */

const ANSWER = "Say when you're running late, before it's late.";

// A free cloud preview, as analyzeChatAi answers one: placeholders for names,
// and locked cards the full report would add.
const READING = {
  insights: {
    answer: ANSWER,
    summary: "Two friends planning trips.",
    vibe: "Travel buddies",
    people: [
      { name: "Person A", role: "Planner", style: "Long messages" },
      { name: "Person B", role: "Follower", style: "Short replies" },
    ],
    dynamics: [{ title: "Quick replies", description: "Within minutes." }],
    topics: [{ title: "Weekend plans", description: "Every Friday." }],
    highlights: ["The lost passport"],
  },
  locked: { people: 0, dynamics: 2, topics: 1, highlights: 2 },
};

const WHATSAPP = "https://wa.me/?text=";

const openWithChat = async (page, file = EXAMPLE_CHAT) => {
  await page.goto("/tools/ai-chat-analyzer/");
  await page.locator("input.hidden-file-input").setInputFiles(file);
  await expect(page.locator("#ai-choose")).toBeVisible();
};

const getReading = async (page) => {
  await page.getByRole("button", { name: "Get my free AI preview" }).click();
  await expect(
    page.locator("#ai-report").getByText("Weekend plans", { exact: true }),
  ).toBeVisible();
};

const sendCard = (page) =>
  page.getByRole("region", { name: /^Send this reading to/ });

test("sends a reading about the two of them, and the other person gets their own", async ({
  page,
  otherPerson,
}) => {
  const docs = await stubShareStore(page.context());
  await stubCallable(page, "analyzeChatAi", READING);
  await openWithChat(page);
  await page
    .getByRole("button", { name: "How could we communicate better?" })
    .click();
  await getReading(page);

  // Who is sending: the reading wasn't written to either of them.
  const send = sendCard(page);
  await expect(
    send.getByRole("heading", {
      name: "Send this reading to the other person",
    }),
  ).toBeVisible();
  await expect(
    send.getByRole("button", { name: "Send this reading" }),
  ).toBeDisabled();
  await send.getByRole("radio", { name: "Jane Doe" }).click();
  await send.getByRole("button", { name: "Send this to John Doe" }).click();

  // Exactly what John gets, before anything is sent: the message...
  await expect(
    send.getByText("Your WhatsApp message to John Doe"),
  ).toBeVisible();
  const message = send.locator(".send-preview__bubble");
  await expect(message).toContainText(
    "I asked an AI how we could communicate better, based on our WhatsApp chat. This is what it said: ",
  );
  // ...and the page the link opens, without the preview's locked cards.
  const preview = send.locator(".send-preview__page");
  await expect(
    preview.getByRole("heading", {
      name: "Jane Doe shared a reading of your chat",
    }),
  ).toBeVisible();
  await expect(preview.getByText(ANSWER)).toBeVisible();
  await expect(
    preview.getByRole("heading", { name: "Get your own reading of this chat" }),
  ).toBeVisible();
  await expect(
    preview.getByText("Something only the full report shows"),
  ).toHaveCount(0);

  // The WhatsApp link carries that message, the encrypted link inside it.
  const whatsApp = send.getByRole("link", { name: "Send in WhatsApp" });
  const href = await whatsApp.getAttribute("href");
  expect(href.startsWith(WHATSAPP)).toBe(true);
  const text = decodeURIComponent(href.slice(WHATSAPP.length));
  expect(text).toBe((await message.textContent()).trim());
  const link = text.match(/https?:\/\/\S+/)[0];
  expect(link).toMatch(/\/s\/?#[A-Za-z0-9_-]{80}$/);
  // The store holds ciphertext only: no name, no reading.
  expect(docs.size).toBe(1);
  const stored = JSON.stringify([...docs.values()]);
  for (const plain of ["Jane Doe", "John Doe", ANSWER, "Weekend plans"]) {
    expect(stored).not.toContain(plain);
  }

  await page
    .context()
    .route("https://wa.me/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "WhatsApp" }),
    );
  const [whatsAppTab] = await Promise.all([
    page.waitForEvent("popup"),
    whatsApp.click(),
  ]);
  expect(whatsAppTab.url()).toBe(href);
  await whatsAppTab.close();
  await expect(
    send.getByText(
      "WhatsApp is opening: pick your chat with John Doe there and send it.",
    ),
  ).toBeVisible();

  // Analytics hear that it was previewed and sent, and nothing of what.
  const sent = (await gaEvents(page)).filter((e) =>
    e.name.startsWith("ai_share_"),
  );
  expect(sent.map((e) => e.name)).toEqual([
    "ai_share_previewed",
    "ai_share_sent",
  ]);
  expect(sent[1].params).toMatchObject({
    ai_question: "better",
    method: "whatsapp",
  });
  expect(JSON.stringify(sent)).not.toMatch(/Jane|John|wa\.me|\/s\/?#/);

  // John, on his own phone, opens it.
  await stubShareStore(otherPerson.context(), docs);
  const theirs = await stubCallable(otherPerson, "analyzeChatAi", READING);
  await otherPerson.goto(link);
  await expect(
    otherPerson.getByRole("heading", {
      name: "Jane Doe shared a reading of your chat",
    }),
  ).toBeVisible();
  await expect(
    otherPerson.getByText(
      "Jane Doe asked an AI how the two of you could communicate better, based on your WhatsApp chat. This is the reading Jane Doe got, unchanged.",
    ),
  ).toBeVisible();
  await expect(
    otherPerson.getByText(
      "It's what an AI read in the chat, not something Jane Doe wrote.",
    ),
  ).toBeVisible();
  await expect(otherPerson.getByText(ANSWER)).toBeVisible();
  await expect(
    otherPerson.getByText("Something only the full report shows"),
  ).toHaveCount(0);
  // It ends with his own reading, not the generic invitation.
  await expect(
    otherPerson.getByRole("heading", {
      name: "Get your own reading of this chat",
    }),
  ).toBeVisible();
  await expect(
    otherPerson.getByRole("link", { name: "Try the sample first" }),
  ).toBeVisible();
  await expect(
    otherPerson.getByText("Ready to see your chat through the eyes of AI?"),
  ).toHaveCount(0);
  expect(
    (await gaEvents(otherPerson)).filter((e) => e.name === "ai_share_opened"),
  ).toEqual([
    {
      name: "ai_share_opened",
      params: expect.objectContaining({ ai_question: "better" }),
    },
  ]);

  // His own chat, the same question already picked.
  await otherPerson
    .getByRole("link", { name: "Try it with my own chat" })
    .click();
  await expect(otherPerson).toHaveURL(/\/tools\/ai-chat-analyzer\/?\?/);
  await otherPerson
    .locator("input.hidden-file-input")
    .setInputFiles(EXAMPLE_CHAT);
  await expect(
    otherPerson.getByRole("button", {
      name: "How could we communicate better?",
    }),
  ).toHaveClass(/chip--on/);
  await getReading(otherPerson);
  expect(theirs).toHaveLength(1);

  const events = await gaEvents(otherPerson);
  expect(events.find((e) => e.name === "ai_analysis_started").params).toEqual(
    expect.objectContaining({ ai_question: "better", source: "shared" }),
  );
  expect(events.filter((e) => e.name === "ai_share_converted")).toEqual([
    {
      name: "ai_share_converted",
      params: expect.objectContaining({
        ai_mode: "preview",
        ai_question: "better",
      }),
    },
  ]);
});

test("the other person can try the sample before their own chat", async ({
  page,
  otherPerson,
}) => {
  const docs = await stubShareStore(page.context());
  await stubCallable(page, "analyzeChatAi", READING);
  await openWithChat(page);
  await page
    .getByRole("button", { name: "How could we communicate better?" })
    .click();
  await getReading(page);
  const send = sendCard(page);
  await send.getByRole("radio", { name: "John Doe" }).click();
  await send.getByRole("button", { name: "Send this to Jane Doe" }).click();
  const href = await send
    .getByRole("link", { name: "Send in WhatsApp" })
    .getAttribute("href");
  const link = decodeURIComponent(href.slice(WHATSAPP.length)).match(
    /https?:\/\/\S+/,
  )[0];

  await stubShareStore(otherPerson.context(), docs);
  const theirs = await stubCallable(otherPerson, "analyzeChatAi", READING);
  await otherPerson.goto(link);
  await otherPerson.getByRole("link", { name: "Try the sample first" }).click();

  // The sample, opened for them, with the same question picked
  await expect(
    otherPerson.getByText("its AI readings were made in advance"),
  ).toBeVisible();
  await expect(
    otherPerson.getByRole("button", {
      name: "How could we communicate better?",
    }),
  ).toHaveClass(/chip--on/);
  expect(theirs).toHaveLength(0);
  expect(
    (await gaEvents(otherPerson)).filter((e) => e.name === "tool_cta_click"),
  ).toEqual([
    {
      name: "tool_cta_click",
      params: expect.objectContaining({
        tool_name: "ai_shared",
        cta_type: "sample",
      }),
    },
  ]);
});

test("a reading with no question can be sent too", async ({ page }) => {
  await stubShareStore(page.context());
  await stubCallable(page, "analyzeChatAi", {
    ...READING,
    insights: { ...READING.insights, answer: "" },
  });
  await openWithChat(page);
  await getReading(page);

  const send = sendCard(page);
  await send.getByRole("radio", { name: "John Doe" }).click();
  await send.getByRole("button", { name: "Send this to Jane Doe" }).click();
  await expect(send.locator(".send-preview__bubble")).toContainText(
    "I had an AI read our WhatsApp chat. This is what it saw: ",
  );
  await expect(
    send
      .locator(".send-preview__page")
      .getByText(
        "John Doe had an AI read the WhatsApp chat between the two of you.",
      ),
  ).toBeVisible();
});

test.describe("one-sided readings stay with the reader", () => {
  const cases = [
    {
      name: "a worry about the other person",
      ask: async (page) => {
        await page.getByRole("button", { name: "Jane Doe" }).click();
        await page
          .getByRole("button", {
            name: "Is there anything I should be worried about?",
          })
          .click();
      },
    },
    {
      name: "one written to the reader as you",
      ask: async (page) => {
        await page.getByRole("button", { name: "Jane Doe" }).click();
        await page
          .getByRole("button", { name: "How could we communicate better?" })
          .click();
      },
    },
    {
      name: "a question of the reader's own",
      ask: async (page) => {
        await page
          .getByRole("button", { name: "Ask your own question" })
          .click();
        await page
          .locator(".ask__input")
          .fill("How could we communicate better?");
      },
    },
    {
      name: "who tries harder",
      ask: (page) =>
        page
          .getByRole("button", { name: "Who puts more effort into this chat?" })
          .click(),
    },
  ];

  for (const { name, ask } of cases) {
    test(name, async ({ page }) => {
      await stubCallable(page, "analyzeChatAi", READING);
      await openWithChat(page);
      await ask(page);
      await getReading(page);
      // The ordinary share link is still there; sending to them is not.
      await expect(
        page.getByRole("button", { name: /Create link and/ }),
      ).toBeVisible();
      await expect(sendCard(page)).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: /^Send this/ }),
      ).toHaveCount(0);
    });
  }

  test("in a group, there's no one other person to send it to", async ({
    page,
  }) => {
    const lines = [
      "1/2/21, 09:00 - Messages and calls are end-to-end encrypted.",
    ];
    const authors = ["Alice Smith", "Bob Jones", "Cara Diaz"];
    for (let i = 0; i < 60; i++) {
      lines.push(
        `1/${2 + (i % 20)}/21, ${9 + (i % 10)}:15 - ${authors[i % 3]}: message ${i}`,
      );
    }
    await stubCallable(page, "analyzeChatAi", READING);
    await openWithChat(page, {
      name: "group.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(lines.join("\n"), "utf-8"),
    });
    await page
      .getByRole("button", { name: "How could we communicate better?" })
      .click();
    await getReading(page);
    await expect(sendCard(page)).toHaveCount(0);
  });

  test("the sample chat isn't anyone's to send", async ({ page }) => {
    await page.clock.install();
    await page.goto("/tools/ai-chat-analyzer/");
    await page.getByRole("button", { name: "Try With Sample Chat" }).click();
    await expect(page.locator("#ai-choose")).toBeVisible();
    await page
      .getByRole("button", { name: "How could we communicate better?" })
      .click();
    await page.getByRole("button", { name: "Show the AI reading" }).click();
    await page.clock.fastForward(10_000);
    await expect(
      page.getByText("This is the sample chat's full reading"),
    ).toBeVisible();
    await expect(sendCard(page)).toHaveCount(0);
  });
});

test("the preview fits a phone @mobile", async ({ page }) => {
  await stubShareStore(page.context());
  await stubCallable(page, "analyzeChatAi", READING);
  await openWithChat(page);
  await page
    .getByRole("button", { name: "How could we communicate better?" })
    .click();
  await getReading(page);

  const send = sendCard(page);
  await send.getByRole("radio", { name: "Jane Doe" }).click();
  await send.getByRole("button", { name: "Send this to John Doe" }).click();
  await expect(
    send.getByRole("link", { name: "Send in WhatsApp" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("a sent link that's gone says so", async ({ page }) => {
  await stubShareStore(page.context());
  await page.goto(`/s#${"A".repeat(80)}`);
  await expect(page.getByText("These results are not available")).toBeVisible();
  expect(
    (await gaEvents(page)).filter((e) => e.name === "ai_share_opened"),
  ).toEqual([]);
});
