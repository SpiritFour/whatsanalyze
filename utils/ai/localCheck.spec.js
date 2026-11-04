import { checkLocalDevice, webllmLimits } from "./localCheck";

const MB = 1 << 20;

/** What a desktop GPU in Chrome reports. */
const GOOD_LIMITS = {
  maxBufferSize: 4096 * MB,
  maxStorageBufferBindingSize: 2048 * MB,
  maxComputeWorkgroupStorageSize: 32768,
  maxStorageBuffersPerShaderStage: 10,
  maxComputeInvocationsPerWorkgroup: 1024,
};

/** A stand-in for navigator.gpu with one adapter. */
const fakeGpu = ({
  limits = GOOD_LIMITS,
  features = ["shader-f16"],
  requestDevice = async () => ({ destroy: jest.fn() }),
  adapter = true,
} = {}) => {
  const theAdapter = {
    limits,
    features: new Set(features),
    requestDevice: jest.fn(requestDevice),
  };
  return {
    adapter: theAdapter,
    requestAdapter: jest.fn(async () => (adapter ? theAdapter : null)),
  };
};

const storageWith = (freeMb) => ({
  estimate: async () => ({ quota: 10_000 * MB, usage: (10_000 - freeMb) * MB }),
});

const pickModel = jest.fn((f16) => ({
  id: f16 ? "f16" : "f32",
  downloadMb: 1_083,
}));

describe("webllmLimits", () => {
  it("asks for what WebLLM asks for", () => {
    expect(webllmLimits(GOOD_LIMITS)).toEqual({
      requiredLimits: {
        maxBufferSize: 1024 * MB,
        maxStorageBufferBindingSize: 1024 * MB,
        maxComputeWorkgroupStorageSize: 32768,
        maxStorageBuffersPerShaderStage: 10,
        maxComputeInvocationsPerWorkgroup: 1024,
      },
    });
  });

  it("falls back where WebLLM falls back", () => {
    const { requiredLimits } = webllmLimits({
      ...GOOD_LIMITS,
      maxBufferSize: 512 * MB,
      maxStorageBufferBindingSize: 512 * MB,
      maxComputeInvocationsPerWorkgroup: 128,
    });
    expect(requiredLimits.maxBufferSize).toBe(256 * MB);
    expect(requiredLimits.maxStorageBufferBindingSize).toBe(128 * MB);
    // Below 256 WebLLM uses the default rather than failing.
    expect(requiredLimits).not.toHaveProperty(
      "maxComputeInvocationsPerWorkgroup",
    );
  });

  it.each([
    ["maxComputeWorkgroupStorageSize", 16384],
    ["maxStorageBuffersPerShaderStage", 8],
    ["maxBufferSize", 128 * MB],
    ["maxStorageBufferBindingSize", 64 * MB],
  ])("fails where WebLLM fails: %s = %d", (name, value) => {
    expect(webllmLimits({ ...GOOD_LIMITS, [name]: value })).toEqual({
      exceeds: name,
    });
  });
});

describe("checkLocalDevice", () => {
  it("passes a capable device with room for the download", async () => {
    const gpu = fakeGpu({ features: ["shader-f16", "subgroups"] });
    const result = await checkLocalDevice(
      { gpu, storage: storageWith(5_000) },
      pickModel,
    );
    expect(result).toEqual({
      ok: true,
      model: { id: "f16", downloadMb: 1_083 },
    });
    const [options] = gpu.adapter.requestDevice.mock.calls[0];
    expect(options.requiredFeatures).toEqual(["shader-f16", "subgroups"]);
    expect(options.requiredLimits.maxStorageBuffersPerShaderStage).toBe(10);
    // The test device is not kept around.
    const device = await gpu.adapter.requestDevice.mock.results[0].value;
    expect(device.destroy).toHaveBeenCalled();
  });

  it("picks the f32 model where the GPU has no f16", async () => {
    const result = await checkLocalDevice(
      { gpu: fakeGpu({ features: [] }), storage: storageWith(5_000) },
      pickModel,
    );
    expect(result.model.id).toBe("f32");
  });

  it("says when there is no WebGPU or no adapter", async () => {
    expect(await checkLocalDevice({}, pickModel)).toMatchObject({
      ok: false,
      reason: "no_webgpu",
    });
    expect(
      await checkLocalDevice({ gpu: fakeGpu({ adapter: false }) }, pickModel),
    ).toMatchObject({ ok: false, reason: "no_adapter" });
  });

  it("turns down a GPU whose limits are too small, before any download", async () => {
    const gpu = fakeGpu({
      limits: { ...GOOD_LIMITS, maxComputeWorkgroupStorageSize: 16384 },
    });
    expect(await checkLocalDevice({ gpu }, pickModel)).toMatchObject({
      ok: false,
      reason: "gpu_limits",
      detail: "maxComputeWorkgroupStorageSize",
    });
    expect(gpu.adapter.requestDevice).not.toHaveBeenCalled();
  });

  it("turns down a driver that won't start a device", async () => {
    const gpu = fakeGpu({
      requestDevice: async () => {
        throw new Error(
          "Failed to execute 'requestDevice' on 'GPUAdapter': D3D12 create command queue failed with DXGI_ERROR_DEVICE_REMOVED",
        );
      },
    });
    expect(await checkLocalDevice({ gpu }, pickModel)).toMatchObject({
      ok: false,
      reason: "gpu_device",
      model: { id: "f16" },
    });
  });

  it("turns down a device without room for the download", async () => {
    expect(
      await checkLocalDevice(
        { gpu: fakeGpu(), storage: storageWith(900) },
        pickModel,
      ),
    ).toMatchObject({ ok: false, reason: "storage", detail: "900 MB free" });
  });

  it("doesn't ask for room for a model that is already there", async () => {
    const result = await checkLocalDevice(
      { gpu: fakeGpu(), storage: storageWith(10) },
      pickModel,
      () => true,
    );
    expect(result.ok).toBe(true);
  });

  it("lets the download find out where storage can't be estimated", async () => {
    const storage = {
      estimate: async () => {
        throw new Error("SecurityError");
      },
    };
    expect(
      (await checkLocalDevice({ gpu: fakeGpu(), storage }, pickModel)).ok,
    ).toBe(true);
    expect((await checkLocalDevice({ gpu: fakeGpu() }, pickModel)).ok).toBe(
      true,
    );
  });
});
