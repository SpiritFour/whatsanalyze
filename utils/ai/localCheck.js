/**
 * Can this device run the on-device model? Asked when a chat is loaded, so a
 * device that can't is pointed at the cloud before anyone clicks, instead of
 * after. Mirrors the checks WebLLM 0.2.85 makes when it loads a model (tvmjs
 * `detectGPUDevice`), which used to be the first place these failures
 * showed: GPUs whose limits are too small, and drivers that won't start a
 * device at all (Windows' "D3D12 create command queue failed"). Storage is
 * checked too, since a download that hits the quota fails at the end.
 */

const MB = 1 << 20;

/**
 * What WebLLM asks `requestDevice` for, given what the adapter offers: the
 * same values, falling back where WebLLM falls back.
 *
 * @param {Record<string, number>} limits the adapter's
 * @returns {{ requiredLimits: Record<string, number> } | { exceeds: string }}
 */
export function webllmLimits(limits) {
  const pick = (name, sizes) => {
    const fits = sizes.find((size) => size <= limits[name]);
    return fits === undefined ? null : fits;
  };
  const maxBufferSize = pick("maxBufferSize", [1024 * MB, 256 * MB]);
  if (maxBufferSize === null) return { exceeds: "maxBufferSize" };
  const maxStorageBufferBindingSize = pick("maxStorageBufferBindingSize", [
    1024 * MB,
    128 * MB,
  ]);
  if (maxStorageBufferBindingSize === null) {
    return { exceeds: "maxStorageBufferBindingSize" };
  }
  if (!(limits.maxComputeWorkgroupStorageSize >= 32 << 10)) {
    return { exceeds: "maxComputeWorkgroupStorageSize" };
  }
  if (!(limits.maxStorageBuffersPerShaderStage >= 10)) {
    return { exceeds: "maxStorageBuffersPerShaderStage" };
  }
  const requiredLimits = {
    maxBufferSize,
    maxStorageBufferBindingSize,
    maxComputeWorkgroupStorageSize: 32 << 10,
    maxStorageBuffersPerShaderStage: 10,
  };
  // Below 256 WebLLM leaves it at the default rather than failing.
  const invocations = pick(
    "maxComputeInvocationsPerWorkgroup",
    [1024, 512, 256],
  );
  if (invocations !== null) {
    requiredLimits.maxComputeInvocationsPerWorkgroup = invocations;
  }
  return { requiredLimits };
}

/**
 * @typedef {"no_webgpu" | "no_adapter" | "gpu_limits" | "gpu_device" | "storage"} LocalUnavailable
 */

/**
 * @param {{ gpu?: any, storage?: any }} env `navigator.gpu` and
 *   `navigator.storage`, passed in so a test can stand in for them
 * @param {(f16: boolean) => { downloadMb: number }} pickModel the model this
 *   device would run; its download is what has to fit
 * @param {(model: any) => boolean} [isDownloaded] nothing to fit if so
 * @returns {Promise<{ ok: true, model: any } | { ok: false, reason: LocalUnavailable, model: any, detail?: string }>}
 */
export async function checkLocalDevice(
  { gpu, storage },
  pickModel,
  isDownloaded = () => false,
) {
  if (!gpu) return { ok: false, reason: "no_webgpu", model: null };
  let adapter;
  try {
    // What WebLLM asks for: a dual-GPU Mac may answer each differently.
    adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
  } catch (error) {
    return {
      ok: false,
      reason: "no_adapter",
      model: null,
      detail: String(error?.message ?? error),
    };
  }
  if (!adapter) return { ok: false, reason: "no_adapter", model: null };

  const f16 = !!adapter.features?.has("shader-f16");
  const model = pickModel(f16);
  const limits = webllmLimits(adapter.limits ?? {});
  if ("exceeds" in limits) {
    return { ok: false, reason: "gpu_limits", model, detail: limits.exceeds };
  }
  const requiredFeatures = ["shader-f16", "subgroups"].filter((feature) =>
    adapter.features?.has(feature),
  );
  try {
    const device = await adapter.requestDevice({
      requiredLimits: limits.requiredLimits,
      requiredFeatures,
    });
    device.destroy?.();
  } catch (error) {
    return {
      ok: false,
      reason: "gpu_device",
      model,
      detail: String(error?.message ?? error),
    };
  }

  if (!isDownloaded(model)) {
    try {
      const { quota, usage } = (await storage?.estimate?.()) ?? {};
      // A tenth more than the files, for what the cache itself keeps.
      if (quota && quota - (usage ?? 0) < model.downloadMb * MB * 1.1) {
        return {
          ok: false,
          reason: "storage",
          model,
          detail: `${Math.round((quota - (usage ?? 0)) / MB)} MB free`,
        };
      }
    } catch {
      // No estimate: let the download find out.
    }
  }
  return { ok: true, model };
}
