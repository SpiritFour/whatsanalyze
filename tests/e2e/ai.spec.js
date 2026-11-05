const {
  EXAMPLE_CHAT,
  expect,
  stubCallable,
  stubCallableFailure,
  test,
} = require("./fixtures");

/**
 * Where an AI run used to end before a report: the on-device model on a
 * device that couldn't run it, and the cloud preview's limits worded as an
 * outage. The model never runs here. WebGPU is faked on the page, for the
 * check made before the model is offered, and the worker that would run it
 * is swapped for one that fails the way WebLLM does on real devices.
 */

const GB = 2 ** 30;

/**
 * A WebGPU whose adapter answers as told: a capable laptop by default, or a
 * driver that won't start a device.
 */
const fakeGpu = (page, { deviceError = null } = {}) =>
  page.addInitScript((deviceError) => {
    const adapter = {
      limits: {
        maxBufferSize: 4 * 2 ** 30,
        maxStorageBufferBindingSize: 2 * 2 ** 30,
        maxComputeWorkgroupStorageSize: 32768,
        maxStorageBuffersPerShaderStage: 10,
        maxComputeInvocationsPerWorkgroup: 1024,
      },
      features: new Set(["shader-f16"]),
      info: { vendor: "test", architecture: "", device: "", description: "" },
      requestDevice: async () => {
        if (deviceError) throw new DOMException(deviceError, "OperationError");
        return { destroy() {} };
      },
    };
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: { requestAdapter: async () => adapter },
    });
  }, deviceError);

/** How much the browser says it may still store for the site. */
const freeStorage = (page, bytes) =>
  page.addInitScript((bytes) => {
    navigator.storage.estimate = async () => ({
      quota: bytes + 2 ** 20,
      usage: 2 ** 20,
    });
  }, bytes);

/** The model's worker, replaced by one that fails every request with `message`. */
const failingWorker = (page, message) =>
  page.route("**/llm.worker*.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `self.onmessage = () => self.postMessage(${JSON.stringify({
        type: "error",
        message,
      })});`,
    }),
  );

const PREVIEW = {
  insights: {
    answer: "",
    summary: "Two friends planning trips.",
    vibe: "Travel buddies",
    people: [{ name: "Person A", role: "Planner", style: "Long messages" }],
    dynamics: [{ title: "Quick replies", description: "Within minutes." }],
    topics: [{ title: "Weekend plans", description: "Every Friday." }],
    highlights: ["The lost passport"],
  },
  locked: { people: 1, dynamics: 0, topics: 0, highlights: 0 },
};

const openWithChat = async (page) => {
  await page.goto("/tools/ai-chat-analyzer/");
  await page.locator("input.hidden-file-input").setInputFiles(EXAMPLE_CHAT);
  await expect(page.locator("#ai-choose")).toBeVisible();
};

const cards = (page) => page.locator("#ai-choose .mode-card");

test.describe("AI chat analyzer: getting to a report", () => {
  test("points a GPU whose driver won't start straight to the cloud", async ({
    page,
  }) => {
    await fakeGpu(page, {
      deviceError:
        "D3D12 create command queue failed with DXGI_ERROR_DEVICE_REMOVED (0x887A0005)",
    });
    await openWithChat(page);

    await expect(
      page.getByText("Your graphics driver wouldn't start the on-device AI."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Analyze on this device" }),
    ).toHaveCount(0);
  });

  test("doesn't offer a download there is no room for", async ({ page }) => {
    await fakeGpu(page);
    await freeStorage(page, 0.5 * GB);
    await openWithChat(page);

    await expect(
      page.getByText(
        "The on-device AI needs about 1.1 GB of free storage, and this device doesn't have that right now.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Analyze on this device" }),
    ).toHaveCount(0);
  });

  test("offers the cloud preview when the on-device AI fails, and runs it", async ({
    page,
  }) => {
    await fakeGpu(page);
    await freeStorage(page, 50 * GB);
    await failingWorker(
      page,
      "Failed to execute 'mapAsync' on 'GPUBuffer': Buffer was unmapped before mapping was resolved.",
    );
    const aiCalls = await stubCallable(page, "analyzeChatAi", PREVIEW);
    await openWithChat(page);

    const local = cards(page).first();
    await expect(local).toContainText("One-time download of about 1.1 GB");
    await page.getByRole("button", { name: "Analyze on this device" }).click();

    await expect(
      page.getByText("The on-device AI ran out of memory."),
    ).toBeVisible();
    // "Try again" now means the 1B model, which needs half the memory.
    await expect(local).toContainText("One-time download of about 0.7 GB");
    await expect(local).toContainText("Built with Llama");

    await page
      .getByRole("button", { name: "Try the free cloud preview instead" })
      .click();
    await expect(
      page.locator("#ai-report").getByText("Weekend plans", { exact: true }),
    ).toBeVisible();
    expect(aiCalls).toHaveLength(1);
    expect(JSON.parse(aiCalls[0].postData()).data.email).toBeUndefined();
  });

  test("offers the cloud instead of a download on mobile data @mobile", async ({
    page,
  }) => {
    await fakeGpu(page);
    await freeStorage(page, 50 * GB);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { type: "cellular" },
      });
    });
    const aiCalls = await stubCallable(page, "analyzeChatAi", PREVIEW);
    await openWithChat(page);

    await page.getByRole("button", { name: "Analyze on this device" }).click();
    await page
      .getByRole("button", { name: "Use the cloud AI instead" })
      .click();

    await expect(
      page.locator("#ai-report").getByText("Weekend plans", { exact: true }),
    ).toBeVisible();
    expect(aiCalls).toHaveLength(1);
  });

  test("tells a visitor their free preview is used up, not that the cloud is down", async ({
    page,
  }) => {
    await stubCallableFailure(page, "analyzeChatAi", "preview_used", {
      status: 429,
      code: "RESOURCE_EXHAUSTED",
    });
    await openWithChat(page);

    await page
      .getByRole("button", { name: "Try a free cloud preview" })
      .click();
    await expect(
      page.getByText("You've used today's free preview."),
    ).toBeVisible();
    await expect(page.getByText("The cloud AI is unavailable")).toHaveCount(0);
  });

  test("says when the day's free previews have all gone", async ({ page }) => {
    await stubCallableFailure(page, "analyzeChatAi", "preview_cap", {
      status: 429,
      code: "RESOURCE_EXHAUSTED",
    });
    await openWithChat(page);

    await page
      .getByRole("button", { name: "Try a free cloud preview" })
      .click();
    await expect(
      page.getByText("All of today's free cloud previews have been used."),
    ).toBeVisible();
  });
});
