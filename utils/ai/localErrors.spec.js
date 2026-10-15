import { localErrorKey } from "./localErrors";

// Messages as WebLLM 0.2.85 words them.
describe("localErrorKey", () => {
  it.each([
    "WebGPU is not supported in your current environment, but it is necessary to run the WebLLM engine.",
    "This model requires WebGPU extension shader-f16, which is not enabled in this browser.",
    "Unable to find a compatible GPU. This issue might be because your computer doesn't have a GPU",
    "Cannot initialize runtime because of requested maxStorageBufferBindingSize exceeds limit. requested=128MB, limit=64MB. ",
    "Failed to execute 'requestDevice' on 'GPUAdapter'",
    "Error while parsing WGSL: :12:3 error: unresolved type 'f16'",
  ])("blames the browser for %s", (message) => {
    expect(localErrorKey(message)).toBe("local_unsupported");
  });

  it.each([
    "The WebGPU device was lost while loading the model. This issue often occurs due to running out of memory (OOM).",
    "Failed to execute 'createBuffer' on 'GPUDevice'",
  ])("blames memory for %s", (message) => {
    expect(localErrorKey(message)).toBe("local_memory");
  });

  it.each(["NetworkError when attempting to fetch resource.", "", "unknown"])(
    "falls back to the generic message for %j",
    (message) => {
      expect(localErrorKey(message)).toBe("local");
    },
  );
});
