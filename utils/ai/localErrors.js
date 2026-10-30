/**
 * Which message an on-device failure deserves, from WebLLM's error text.
 * Everything used to read as "not enough memory", which sent a Mac on a
 * browser without full WebGPU looking for RAM it already had.
 *
 * @param {string} message
 * @returns {"local_unsupported" | "local_memory" | "local"}
 */
export function localErrorKey(message) {
  if (
    /WebGPU is not supported|Cannot find WebGPU|compatible GPU|shader-f16|exceeds limit|requestDevice|not enabled in this browser|WGSL|ShaderModule|validation/i.test(
      message,
    )
  ) {
    return "local_unsupported";
  }
  if (
    /device was lost|out of memory|\bOOM\b|createBuffer|allocat/i.test(message)
  ) {
    return "local_memory";
  }
  return "local";
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
