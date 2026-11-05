/**
 * What this browser has shown it can't do: run the on-device AI. Remembered
 * so the next run can offer the cloud preview first instead of failing the
 * same way again (docs/saved-chats.md, "Remember the device").
 *
 * In localStorage rather than the library: it describes the browser, not a
 * chat, it has to be there for visitors who keep no chats, and the AI page
 * needs the answer synchronously. A browser update can bring WebGPU along, so
 * a failure recorded under a different user agent no longer counts.
 */
const KEY = "whatsanalyze_local_ai_failed";

const userAgent = () =>
  typeof navigator === "undefined" ? "" : navigator.userAgent;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};

/**
 * Note that the on-device AI failed here. `reason` is the page's error key
 * (local_unsupported, local_memory, local, or crashed when the tab died).
 */
export function rememberLocalAiFailure(
  { reason, model = null, phase = null },
  { now = Date.now() } = {},
) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ reason, model, phase, at: now, userAgent: userAgent() }),
    );
  } catch {
    // Storage blocked: the next run finds out the hard way, as it does today.
  }
}

/** The last on-device failure in this browser, or null if there is none that still counts. */
export function localAiFailure() {
  const failure = read();
  if (!failure || failure.userAgent !== userAgent()) return null;
  return failure;
}

/** Has the on-device AI failed in this browser (as it is now)? */
export const didLocalAiFail = () => localAiFailure() !== null;

/** It worked after all: stop steering this browser away from it. */
export function forgetLocalAiFailure() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget where storage is blocked.
  }
}
