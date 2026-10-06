// Runs the on-device model off the main thread, so the page keeps scrolling
// while it downloads and thinks. All of WebLLM lives here: the page talks to
// it only through the messages below (see utils/ai/localModel.ts), so its
// 6 MB never lands in a chunk the page itself loads.
import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";

let engine: Promise<MLCEngine> | null = null;

self.onmessage = async ({ data }: MessageEvent) => {
  const { model, request } = data;
  try {
    engine ??= CreateMLCEngine(model, {
      initProgressCallback: (report) =>
        self.postMessage({
          type: "progress",
          progress: report.progress,
          elapsed: report.timeElapsed,
        }),
    });
    const reply = await (await engine).chat.completions.create(request);
    self.postMessage({
      type: "done",
      content: reply.choices[0]?.message?.content ?? "",
    });
  } catch (error: any) {
    // A failed load must not be kept, or every retry fails the same way.
    engine = null;
    self.postMessage({
      type: "error",
      message: String(error?.message ?? error),
    });
  }
};
