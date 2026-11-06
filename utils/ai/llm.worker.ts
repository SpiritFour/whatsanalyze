// Runs the on-device model off the main thread, so the page keeps scrolling
// while it downloads and thinks. All of WebLLM lives here: the page talks to
// it only through the messages below (see utils/ai/localModel.ts), so its
// 6 MB never lands in a chunk the page itself loads.
import { MLCEngine } from "@mlc-ai/web-llm";
import { isContextOverflow, retryDownload } from "~/utils/ai/localErrors";

const engine = new MLCEngine({
  initProgressCallback: (report) =>
    self.postMessage({
      type: "progress",
      progress: report.progress,
      elapsed: report.timeElapsed,
    }),
});

/** The model loaded (or loading), and for which id. */
let loaded: { model: string; ready: Promise<void> } | null = null;

/** Resolves once the browser thinks it is online again. */
const online = () =>
  new Promise<void>((resolve) => {
    if (navigator.onLine) return resolve();
    self.addEventListener("online", () => resolve(), { once: true });
  });

// One engine for the worker's life: reload() unloads the previous model
// before it loads. A fresh engine per attempt left the old one's GPU memory
// to garbage collection, which a retry on a small GPU can't wait for.
const load = (model: string) =>
  retryDownload(() => engine.reload(model), {
    wait: (ms) =>
      online().then(() => new Promise((resolve) => setTimeout(resolve, ms))),
    onRetry: (attempt) => self.postMessage({ type: "retry", attempt }),
  });

self.onmessage = async ({ data }: MessageEvent) => {
  const { model, request } = data;
  try {
    if (!loaded || loaded.model !== model) {
      loaded = { model, ready: load(model) };
    }
    await loaded.ready;
    const reply = await engine.chat.completions.create(request);
    self.postMessage({
      type: "done",
      content: reply.choices[0]?.message?.content ?? "",
      finish: reply.choices[0]?.finish_reason,
    });
  } catch (error: any) {
    const message = String(error?.message ?? error);
    // A failed load or a lost device must not be kept, or every retry fails
    // the same way. A prompt that was too long left the model as it was.
    if (!isContextOverflow(message)) loaded = null;
    self.postMessage({ type: "error", message });
  }
};
