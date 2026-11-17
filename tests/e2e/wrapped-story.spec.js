/**
 * The 2026 Wrapped story: the guesses, the share card, and the link that
 * carries the story over WhatsApp to the other person in the chat.
 *
 * The example chat is John Doe and Jane Doe, 2021: John sends more, John
 * answers faster, and both have enough messages for an age and a role.
 */
const path = require("path");
const {
  EXAMPLE_CHAT,
  expect,
  gaEvents,
  stubShareStore,
  test,
} = require("./fixtures");

/**
 * A made-up group chat in the iOS export format: three people, photos,
 * voice notes, stickers, a double-text run, a deleted and an edited message,
 * and one long June evening.
 */
const GROUP_CHAT = path.resolve(__dirname, "../fixtures/wrapped_group_ios.txt");

/** Steps on until `target` is on screen, as the arrow key does. */
const stepTo = async (page, target, max = 30) => {
  for (let i = 0; i < max && !(await target.isVisible()); i += 1) {
    await page.keyboard.press("ArrowRight");
    // Each slide fades out before the next one fades in.
    await page.waitForTimeout(250);
  }
  await expect(target).toBeVisible();
};

const openOwnStory = async (page) => {
  await page.goto("/wrapped/");
  await page.locator("#dropzone-file").setInputFiles(EXAMPLE_CHAT);
  await page.waitForURL(/wrapped\/results/);
  await expect(page.locator(".cover-names")).toHaveText("John & Jane");
};

test.describe("the Wrapped story", () => {
  test("waits for a guess, then shows the answer", async ({ page }) => {
    await openOwnStory(page);

    const options = page.getByTestId("guess-talker");
    await stepTo(page, options.first());
    await expect(options).toHaveText(["Jane", "John"]);

    // Longer than a slide lasts: the story holds until there is a guess.
    await page.waitForTimeout(7500);
    await expect(options.first()).toBeVisible();

    await options.filter({ hasText: "Jane" }).click();
    await expect(page.getByText("Not quite")).toBeVisible();
    await expect(
      page.getByText(/^John sent \d+% of all messages\.$/),
    ).toBeVisible();
    expect(
      (await gaEvents(page)).some(
        (event) =>
          event.name === "wrapped_guess" &&
          event.params.question === "talker" &&
          event.params.correct === false,
      ),
    ).toBe(true);
  });

  test("tells everyone's texting age and role", async ({ page }) => {
    await openOwnStory(page);

    const ages = page.getByTestId("texting-age");
    await stepTo(page, ages);
    await expect(ages.locator(".age-person")).toHaveCount(2);

    const roles = page.getByTestId("roles");
    await stepTo(page, roles);
    await expect(roles.locator(".role")).toHaveCount(2);
    // Two people, two different roles.
    const titles = await roles.locator(".role__title").allTextContents();
    expect(new Set(titles).size).toBe(2);
  });

  test("sends the story on WhatsApp in one tap, and it opens for the other person", async ({
    page,
    otherPerson,
  }) => {
    const docs = await stubShareStore(page.context());
    await stubShareStore(otherPerson.context(), docs);
    await page
      .context()
      .route("https://wa.me/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "WhatsApp" }),
      );

    await openOwnStory(page);
    const whatsapp = page.getByTestId("whatsapp-link");
    await stepTo(page, whatsapp);
    await expect(page.getByTestId("share-card")).toBeVisible();

    // A real link before the tap: Safari only hands a link to WhatsApp
    // straight from the tap, and would block one opened after an upload.
    const href = await whatsapp.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const message = new URL(href).searchParams.get("text");
    expect(message).toContain("Can you guess who texts more?");
    const storyUrl = message.match(/https?:\/\/\S+/)[0];
    expect(storyUrl).toContain("utm_medium=whatsapp#s=");
    // The key travels in the fragment, short enough not to swamp the chat.
    expect(new URL(storyUrl).hash.length).toBeLessThan(110);

    // Nothing of the chat has left the device yet.
    expect(docs.size).toBe(0);

    const popup = page.waitForEvent("popup");
    await whatsapp.click();
    await popup;
    await expect.poll(() => docs.size).toBe(1);

    await otherPerson.goto(storyUrl.replace(/^https?:\/\/[^/]+/, ""));
    await expect(otherPerson.locator(".cover-names")).toHaveText("John & Jane");
    // Somebody else's story is not saved on their device.
    await expect(otherPerson.locator(".library-status")).toHaveCount(0);

    const makeYours = otherPerson.getByTestId("make-yours");
    await stepTo(otherPerson, makeYours);
    await expect(otherPerson.getByTestId("whatsapp-link")).toHaveCount(0);
    await makeYours.click();
    await expect(otherPerson).toHaveURL(/\/wrapped\/$/);
  });

  test("copies the link before the story is uploaded", async ({ page }) => {
    const docs = await stubShareStore(page.context());
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);

    await openOwnStory(page);
    const copy = page.getByTestId("copy-link");
    await stepTo(page, copy);
    await copy.click();

    await expect(
      page.getByText("Secure link copied to your clipboard."),
    ).toBeVisible();
    expect(docs.size).toBe(1);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(
      /\/wrapped\/results\/\?.*#s=[\w-]+\.[\w-]+\.[\w-]+$/,
    );
  });

  test("says so when the story could not be uploaded, and tries again", async ({
    page,
  }) => {
    let failing = true;
    const docs = await stubShareStore(page.context());
    await page
      .context()
      .route("https://firestore.googleapis.com/**", async (route) => {
        if (failing && route.request().method() === "POST") {
          await route.fulfill({
            status: 503,
            headers: { "access-control-allow-origin": "*" },
            json: { error: { code: 503, status: "UNAVAILABLE" } },
          });
          return;
        }
        await route.fallback();
      });
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);

    await openOwnStory(page);
    const copy = page.getByTestId("copy-link");
    await stepTo(page, copy);
    await copy.click();

    const error = page.getByRole("alert");
    await expect(error).toContainText("The story didn't upload");
    expect(docs.size).toBe(0);

    failing = false;
    await error.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText("Done. The link works now.")).toBeVisible();
    expect(docs.size).toBe(1);
  });

  test("opens a link made before the short format", async ({
    page,
    otherPerson,
  }) => {
    const docs = await stubShareStore(page.context());
    await stubShareStore(otherPerson.context(), docs);
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);

    await openOwnStory(page);
    const copy = page.getByTestId("copy-link");
    await stepTo(page, copy);
    await copy.click();
    await expect(
      page.getByText("Secure link copied to your clipboard."),
    ).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());

    // The same story, its key written the way links were until now.
    const legacy = await page.evaluate((url) => {
      const [uuid, iv, key] = new URL(url).hash.slice(3).split(".");
      const bytes = (text) =>
        Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (char) =>
          char.charCodeAt(0),
        );
      return `/wrapped/results/#${new URLSearchParams({
        uuid,
        iv: JSON.stringify(bytes(iv)),
        key: JSON.stringify(bytes(key)),
      })}`;
    }, copied);

    await otherPerson.goto(legacy);
    await expect(otherPerson.locator(".cover-names")).toHaveText("John & Jane");
  });

  test("plays the sample chat without saving or sharing it", async ({
    page,
  }) => {
    await page.goto("/wrapped/");
    await page.getByTestId("wrapped-sample").click();
    await page.waitForURL(/wrapped\/results/);

    await expect(page.locator(".cover-names")).toHaveText("Emma & Leo");
    await expect(page.getByText("Sample chat")).toBeVisible();
    await expect(page.locator(".library-status")).toHaveCount(0);

    const makeYours = page.getByTestId("make-yours");
    await stepTo(page, makeYours);
    await expect(page.getByTestId("whatsapp-link")).toHaveCount(0);
    await expect(page.getByTestId("share-image")).toHaveCount(0);
    await makeYours.click();
    await expect(page).toHaveURL(/\/wrapped\/$/);
  });

  test("finds the moments of a group chat", async ({ page }) => {
    await page.goto("/wrapped/");
    await page.locator("#dropzone-file").setInputFiles(GROUP_CHAT);
    await page.waitForURL(/wrapped\/results/);
    await expect(page.locator(".cover-names")).toHaveText("3 people, one chat");

    const funny = page.getByTestId("guess-funny");
    await stepTo(page, funny.first());
    await expect(funny).toHaveCount(3);
    await funny.first().click();
    await expect(page.getByText(/got the most laughs: \d+\.$/)).toBeVisible();

    await stepTo(page, page.getByText("Longest conversation"));
    await expect(
      page.getByText("63 messages on June 12", { exact: false }),
    ).toBeVisible();

    await stepTo(page, page.getByText("11 messages in a row"));
    await expect(
      page.getByText("Tariq on August 2, before anyone answered"),
    ).toBeVisible();

    const stuff = page.getByTestId("stuff");
    await stepTo(page, stuff);
    await expect(stuff).toContainText("voice notes");
    await expect(stuff).toContainText("stickers");
    await expect(page.getByText("2 deleted messages")).toBeVisible();
    await expect(page.getByText(/All of them by Jonas\./)).toBeVisible();
    await expect(page.getByText("1 edited message")).toBeVisible();

    // How in sync is a two-person thing.
    await expect(page.getByTestId("chemistry")).toHaveCount(0);
  });

  test("tells the sample couple's funniest message, soft side and chemistry", async ({
    page,
  }) => {
    await page.goto("/wrapped/");
    await page.getByTestId("wrapped-sample").click();
    await page.waitForURL(/wrapped\/results/);

    await stepTo(page, page.getByText("The message that broke the chat"));
    await expect(page.locator(".funny-quote__text")).not.toBeEmpty();

    const soft = page.getByTestId("soft-side");
    await stepTo(page, soft);
    await expect(soft).toContainText("I love you");
    await expect(soft).toContainText("Sorry");

    const chemistry = page.getByTestId("chemistry");
    await stepTo(page, chemistry);
    await expect(page.locator(".sync-score")).toHaveText(/^\d{2}%$/);
    // Nobody's chat to post: no card from the sample.
    await expect(page.getByText("Share this card")).toHaveCount(0);
  });

  test("lands on the right slide after a burst of taps", async ({ page }) => {
    await page.goto("/wrapped/");
    await page.getByTestId("wrapped-sample").click();
    await page.waitForURL(/wrapped\/results/);
    await expect(page.locator(".cover-names")).toHaveText("Emma & Leo");

    for (let i = 0; i < 9; i += 1) await page.keyboard.press("ArrowRight");
    // The sample's tenth slide, and only it, once the fade is over.
    await expect(page.locator(".story-slide")).toHaveCount(1);
    await expect(page.locator(".story-eyebrow")).toHaveText("Texting age");
  });

  test("steps one slide per tap, and holds while pressed", async ({ page }) => {
    await openOwnStory(page);
    const story = page.locator(".story-progress + div");
    const box = await story.boundingBox();
    const right = { x: box.x + box.width - 20, y: box.y + box.height / 2 };
    const filled = () =>
      page
        .locator(".story-progress__fill")
        .evaluateAll(
          (fills) =>
            fills.filter((fill) => fill.style.transform === "scaleX(1)").length,
        );

    const before = await filled();
    await page.mouse.click(right.x, right.y);
    await expect.poll(filled).toBe(before + 1);

    // A press longer than a tap pauses the story and does not step on.
    await page.mouse.move(right.x, right.y);
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(await filled()).toBe(before + 1);
  });

  test("keeps the closing slide's buttons on a small phone @mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 560 });
    await openOwnStory(page);

    const whatsapp = page.getByTestId("whatsapp-link");
    await stepTo(page, whatsapp);
    // Scrolled into reach, not cut off: the slide scrolls when it is taller
    // than the screen.
    await expect(page.getByText("That's a wrap")).toBeInViewport();
    await whatsapp.scrollIntoViewIfNeeded();
    await expect(whatsapp).toBeInViewport();
  });
});
