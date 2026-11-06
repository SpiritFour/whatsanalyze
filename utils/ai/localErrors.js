/**
 * Which message an on-device failure deserves, from WebLLM's error text.
 * Everything used to read as "not enough memory", which sent a Mac on a
 * browser without full WebGPU looking for RAM it already had.
 *
 * "local_gpu" is a GPU the browser has but whose driver won't start a
 * device (Windows' "D3D12 create command queue failed", often after a GPU
 * reset), where trying another browser is no help but a restart can be.
 * Losing the device mid-run (mapAsync on a dead buffer, disposed objects)
 * reads as memory: that is almost always why it is lost.
 *
 * @param {string} message
 * @returns {"local_unsupported" | "local_gpu" | "local_memory" | "local_network" | "local_storage" | "local"}
 */
export function localErrorKey(message) {
  if (/requestDevice|command queue|DXGI/i.test(message)) return "local_gpu";
  if (
    /WebGPU is not supported|Cannot find WebGPU|compatible GPU|shader-f16|exceeds limit|not enabled in this browser|WGSL|ShaderModule|validation/i.test(
      message,
    )
  ) {
    return "local_unsupported";
  }
  if (/quota|file system/i.test(message)) return "local_storage";
  if (isNetworkError(message)) return "local_network";
  if (
    /device was lost|is lost|out of memory|\bOOM\b|createBuffer|allocat|mapAsync|unmapped|map async|already been disposed|external Instance/i.test(
      message,
    )
  ) {
    return "local_memory";
  }
  return "local";
}

/**
 * A download that broke off: Safari says "Load failed", Chrome "Failed to
 * fetch" or Cache.add()'s "network error", Firefox "NetworkError", and
 * WebLLM "Cannot fetch <url>" for a shard that never arrived.
 *
 * @param {string} message
 */
export const isNetworkError = (message) =>
  /Load failed|Failed to fetch|NetworkError|network error|network connection was lost|Cannot fetch|Request failed|net::ERR_/i.test(
    message,
  );

/** A prompt longer than the model's 4k context, in tokens WebLLM counted. */
export const isContextOverflow = (message) =>
  /exceed context window/i.test(message);

/**
 * Load the model again after an interrupted download. WebLLM keeps each
 * finished shard in Cache Storage and skips it on the next load, so a retry
 * picks up where the connection dropped instead of starting over — which is
 * what a visitor clicking "try again" got too, only by hand.
 *
 * @template T
 * @param {() => Promise<T>} load
 * @param {{ delays?: number[], wait?: (ms: number) => Promise<void>,
 *   onRetry?: (attempt: number) => void }} [options]
 * @returns {Promise<T>}
 */
export async function retryDownload(
  load,
  {
    delays = [2_000, 5_000, 15_000],
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    onRetry = () => {},
  } = {},
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await load();
    } catch (error) {
      const message = String(error?.message ?? error);
      if (attempt >= delays.length || !isNetworkError(message)) throw error;
      onRetry(attempt + 1);
      await wait(delays[attempt]);
    }
  }
}

/**
 * One Sentry issue per cause: WebLLM's text carries sizes, addresses and
 * buffer labels that would otherwise split a cause into an issue each.
 *
 * @param {string} message
 * @returns {string}
 */
export function localErrorCause(message) {
  return message
    .replace(/0x[0-9a-f]+/gi, "0x?")
    .replace(/\[[^\]]*\]|"[^"]*"/g, "?")
    .replace(/\d+(\.\d+)?/g, "#")
    .trim()
    .slice(0, 120);
}
