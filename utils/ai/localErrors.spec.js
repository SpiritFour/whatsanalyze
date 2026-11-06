import {
  isContextOverflow,
  isNetworkError,
  localErrorCause,
  localErrorKey,
  retryDownload,
} from "./localErrors";

// Messages as WebLLM 0.2.85 and the browsers word them; the long ones as GA4
// reported them, cut at 100 characters.
describe("localErrorKey", () => {
  it.each([
    "WebGPU is not supported in your current environment, but it is necessary to run the WebLLM engine.",
    "This model requires WebGPU extension shader-f16, which is not enabled in this browser.",
    "Unable to find a compatible GPU. This issue might be because your computer doesn't have a GPU, or yo",
    "Cannot initialize runtime because of requested maxStorageBufferBindingSize exceeds limit. requested=128MB, limit=64MB. ",
    "Cannot initialize runtime because of requested maxComputeWorkgroupStorageSize exceeds limit. request",
    "Error while parsing WGSL: :12:3 error: unresolved type 'f16'",
  ])("blames the browser for %s", (message) => {
    expect(localErrorKey(message)).toBe("local_unsupported");
  });

  it.each([
    "Failed to execute 'requestDevice' on 'GPUAdapter': D3D12 create command queue failed with DXGI_ERROR",
    "Failed to execute 'requestDevice' on 'GPUAdapter'",
  ])("blames the graphics driver for %s", (message) => {
    expect(localErrorKey(message)).toBe("local_gpu");
  });

  it.each([
    "The WebGPU device was lost while loading the model. This issue often occurs due to running out of memory (OOM).",
    "Failed to execute 'createBuffer' on 'GPUDevice'",
    "Failed to execute 'mapAsync' on 'GPUBuffer': Buffer was unmapped before mapping was resolved.",
    "Failed to execute 'mapAsync' on 'GPUBuffer': A valid external Instance reference no longer exists.",
    "Failed to execute 'mapAsync' on 'GPUBuffer': [Device] is lost.",
    "Object has already been disposed",
  ])("blames memory for %s", (message) => {
    expect(localErrorKey(message)).toBe("local_memory");
  });

  it.each([
    "Load failed",
    "Failed to fetch",
    "Failed to execute 'add' on 'Cache': Cache.add() encountered a network error",
    "NetworkError when attempting to fetch resource.",
    "Cannot fetch https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/mlc-chat-c",
  ])("blames the connection for %s", (message) => {
    expect(localErrorKey(message)).toBe("local_network");
  });

  it.each(["Quota exceeded.", "Failed writing data to the file system"])(
    "blames storage for %s",
    (message) => {
      expect(localErrorKey(message)).toBe("local_storage");
    },
  );

  it.each([
    "Grammar matcher rejected the newly sampled token.",
    "Cannot pass deleted object as a pointer of type GrammarMatcher",
    "",
    "unknown",
  ])("falls back to the generic message for %j", (message) => {
    expect(localErrorKey(message)).toBe("local");
  });
});

describe("isNetworkError and isContextOverflow", () => {
  it("tells a broken download from a broken GPU", () => {
    expect(isNetworkError("Load failed")).toBe(true);
    expect(isNetworkError("Object has already been disposed")).toBe(false);
  });

  it("spots a prompt over the context window", () => {
    expect(
      isContextOverflow(
        "Prompt tokens exceed context window size: number of prompt tokens: 4404; context window size: 4096",
      ),
    ).toBe(true);
    expect(isContextOverflow("Load failed")).toBe(false);
  });
});

describe("retryDownload", () => {
  const noWait = () => Promise.resolve();

  it("loads again after the connection drops, until it gets through", async () => {
    const failures = [
      new TypeError("Load failed"),
      new Error("Failed to fetch"),
    ];
    const load = jest.fn(async () => {
      if (failures.length) throw failures.shift();
      return "loaded";
    });
    const retries = [];
    const waits = [];

    await expect(
      retryDownload(load, {
        delays: [10, 20, 30],
        wait: async (ms) => waits.push(ms),
        onRetry: (attempt) => retries.push(attempt),
      }),
    ).resolves.toBe("loaded");
    expect(load).toHaveBeenCalledTimes(3);
    expect(retries).toEqual([1, 2]);
    expect(waits).toEqual([10, 20]);
  });

  it("gives up once the delays are used up", async () => {
    const load = jest.fn(async () => {
      throw new Error("Failed to fetch");
    });
    await expect(
      retryDownload(load, { delays: [1, 1], wait: noWait }),
    ).rejects.toThrow("Failed to fetch");
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("doesn't retry what a retry can't fix", async () => {
    const load = jest.fn(async () => {
      throw new Error("Object has already been disposed");
    });
    await expect(retryDownload(load, { wait: noWait })).rejects.toThrow(
      "disposed",
    );
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("localErrorCause", () => {
  it("groups the same cause across sizes, codes and labels", () => {
    expect(
      localErrorCause(
        "Cannot initialize runtime because of requested maxStorageBufferBindingSize exceeds limit. requested=128MB, limit=64MB. ",
      ),
    ).toBe(
      localErrorCause(
        "Cannot initialize runtime because of requested maxStorageBufferBindingSize exceeds limit. requested=256MB, limit=128MB.",
      ),
    );
    expect(
      localErrorCause(
        "Failed to execute 'mapAsync' on 'GPUBuffer': [Buffer \"a\"] was unmapped before mapping was resolved.",
      ),
    ).toBe(
      localErrorCause(
        "Failed to execute 'mapAsync' on 'GPUBuffer': [Buffer \"b 2\"] was unmapped before mapping was resolved.",
      ),
    );
    expect(localErrorCause("D3D12 failed with 0x887A0005")).toBe(
      localErrorCause("D3D12 failed with 0x887A0006"),
    );
  });

  it("keeps different causes apart", () => {
    expect(
      localErrorCause("requested maxComputeWorkgroupStorageSize exceeds limit"),
    ).not.toBe(
      localErrorCause("requested maxStorageBufferBindingSize exceeds limit"),
    );
    expect(localErrorCause("Quota exceeded.")).not.toBe(
      localErrorCause("Load failed"),
    );
  });
});
