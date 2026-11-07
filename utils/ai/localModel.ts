import { z } from "zod";
import * as Sentry from "@sentry/nuxt";
import { isContextOverflow, localErrorCause } from "~/utils/ai/localErrors";
import { checkLocalDevice } from "~/utils/ai/localCheck";
import {
  namePeopleByAlias,
  readLocalReport,
  withoutThinking,
} from "~/utils/ai/localReport";
import { splitParts } from "~/utils/ai/digest";
import {
  buildAnswerPrompt,
  buildCoachPrompt,
  buildNotesPrompt,
  buildPrompt,
  insightsSchema,
  type AiAsk,
  type AiLanguage,
  type ChatDigest,
  type ChatInsights,
  type CoachKind,
  type CoachTurn,
} from "~/functions/src/ai/insights";

/**
 * The private half of the AI chat analysis: a small open model downloaded
 * once into the browser cache and run on the device's GPU through WebLLM.
 * Nothing leaves the device; the price is a one-time download and a model far
 * less perceptive than the cloud one.
 *
 * Same prompt and schema as the cloud (functions/src/ai/insights.ts). The
 * models' context is 4k tokens — a few hundred messages — so a longer sample
 * is read in parts: the model takes short notes on each, then writes the
 * report from the notes. The schema is spelled out in the prompt because a
 * model this size needs telling what each field is for; the grammar alone
 * only keeps the JSON valid.
 */

export interface LocalModel {
  id: string;
  /** Download size, measured from the files on Hugging Face. */
  downloadMb: number;
  /** One part: what fits the 4k context next to the notes prompt and notes. */
  partChars: number;
  /**
   * Parts read at most. Each is a model call (tens of seconds on a phone),
   * and all their notes plus the schema must fit the final call's context.
   */
  maxParts: number;
  /** Qwen thinks out loud unless told not to; other models have no switch. */
  qwen: boolean;
  /** The 1B model: what phones run, and computers the 2B one ran out of memory on. */
  small: boolean;
}

/**
 * Computers get Qwen3.5 2B, the best of what fits. Phones get Llama 3.2 1B:
 * Qwen needs ~2.2 GB of GPU memory, and iOS Safari killed the tab outright on
 * the first real iPhone test. Llama needs ~0.9 GB and officially speaks all
 * six of the site's languages; Gemma 3 1B is smaller still but English-only.
 */
const DESKTOP = (f16: boolean): LocalModel => ({
  id: f16 ? "Qwen3.5-2B-q4f16_1-MLC" : "Qwen3.5-2B-q4f32_1-MLC",
  downloadMb: 1_083,
  partChars: 6_000,
  maxParts: 8,
  qwen: true,
  small: false,
});
const MOBILE = (f16: boolean): LocalModel => ({
  id: f16
    ? "Llama-3.2-1B-Instruct-q4f16_1-MLC"
    : "Llama-3.2-1B-Instruct-q4f32_1-MLC",
  downloadMb: 705,
  partChars: 5_000,
  maxParts: 6,
  qwen: false,
  small: true,
});

/**
 * Where an on-device analysis is. `elapsed` is seconds into that phase;
 * `retry` is set while an interrupted download waits to pick up again.
 */
export type AiProgress =
  | { phase: "download"; progress: number; elapsed: number; retry?: number }
  | { phase: "read"; done: number; total: number; elapsed: number }
  | { phase: "write"; total: number };

/** How much transcript to sample for this model: every part it will read. */
export const localTranscriptChars = (model: LocalModel) =>
  model.partChars * model.maxParts;

/**
 * Set once the model has loaded here, so a returning visitor isn't warned
 * about a download that won't happen. WebLLM keeps the weights in Cache
 * Storage; clearing site data clears both.
 */
const DOWNLOADED_KEY = "whatsanalyze_ai_model";
/**
 * Set while the model runs, to the model and phase. A tab the OS kills for
 * memory gets no chance to clear it, so finding it on the next visit means
 * the last attempt crashed there.
 */
const RUNNING_KEY = "whatsanalyze_ai_running";
/**
 * Set once the 2B model ran this computer out of GPU memory (or crashed the
 * tab), so from then on it gets the 1B model phones run: less perceptive,
 * but it needs ~0.9 GB instead of ~2.2 GB.
 */
const SMALL_KEY = "whatsanalyze_ai_small";

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string | null) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Private mode: the worst case is one warning too many.
    }
  },
};

let worker: Worker | null = null;

const isMobile = () =>
  (navigator as any).userAgentData?.mobile ??
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/** Why the on-device AI isn't offered on this device. */
export type LocalUnavailable =
  "no_webgpu" | "no_adapter" | "gpu_limits" | "gpu_device" | "storage";

/** The model this device runs: see SMALL_KEY. */
const modelFor = (f16: boolean): LocalModel =>
  isMobile() || storage.get(SMALL_KEY) ? MOBILE(f16) : DESKTOP(f16);

/**
 * Can this device run the on-device model, and which one? Asked when a chat
 * is loaded, so a device that can't is pointed at the cloud before anyone
 * clicks; utils/ai/localCheck.js has what is checked and why. `model` is
 * the one this device would get, even without a GPU to check it on.
 */
export async function checkLocalModel(): Promise<{
  model: LocalModel | null;
  unavailable: LocalUnavailable | null;
  detail?: string;
}> {
  const result = await checkLocalDevice(
    { gpu: (navigator as any).gpu, storage: navigator.storage },
    modelFor,
    isModelDownloaded,
  );
  return result.ok
    ? { model: result.model, unavailable: null }
    : {
        // Without a GPU there's no model to check, but the page still
        // describes the one this device would get: its download read
        // "about 0 GB" on an iPhone without WebGPU.
        model: result.model ?? modelFor(false),
        unavailable: result.reason,
        detail: result.detail,
      };
}

/**
 * After the 2B model ran out of memory here: the 1B one, from now on. Null
 * when this already was the small model, which has nothing smaller to try.
 */
export function smallerModel(model: LocalModel): LocalModel | null {
  if (model.small) return null;
  storage.set(SMALL_KEY, "1");
  return MOBILE(model.id.includes("q4f16"));
}

/**
 * On-device failures to Sentry, with what tells GPUs apart. A message, not
 * an exception: beforeSend opens the user report dialog for exceptions.
 * `extra` is anything else that tells causes apart, such as why the model
 * stopped writing.
 */
export async function reportLocalFailure(
  message: string,
  model?: string,
  phase?: string,
  extra?: Record<string, unknown>,
) {
  const gpu = await gpuInfo();
  Sentry.captureMessage(`On-device AI failed: ${message}`, {
    level: "warning",
    fingerprint: ["local-ai", localErrorCause(message)],
    tags: {
      ai_model: model,
      ai_phase: phase,
      gpu_vendor: gpu.vendor as string | undefined,
    },
    contexts: { webgpu: gpu, ...(extra ? { ai: extra } : {}) },
  });
}

/** The adapter WebLLM runs on: what Sentry needs to tell GPUs apart. */
export async function gpuInfo(): Promise<Record<string, unknown>> {
  try {
    const adapter = await (navigator as any).gpu?.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) return { adapter: "none" };
    const { vendor, architecture, device, description } = adapter.info ?? {};
    const { limits } = adapter;
    return {
      vendor,
      architecture,
      device,
      description,
      shaderF16: adapter.features.has("shader-f16"),
      maxBufferSize: limits.maxBufferSize,
      maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
      maxComputeWorkgroupStorageSize: limits.maxComputeWorkgroupStorageSize,
    };
  } catch (error: any) {
    return { adapter: String(error?.message ?? error) };
  }
}

/** Has this model already been downloaded into this browser? */
export function isModelDownloaded(model: LocalModel): boolean {
  return storage.get(DOWNLOADED_KEY) === model.id;
}

/**
 * Did the last on-device run die with the tab, and where? Reading the answer
 * clears it, so one crash is reported once.
 */
export function takeCrashedRun(): { model?: string; phase?: string } | null {
  const running = storage.get(RUNNING_KEY);
  storage.set(RUNNING_KEY, null);
  if (running === null) return null;
  try {
    return JSON.parse(running);
  } catch {
    return {};
  }
}

/**
 * Why a phone should think twice before the download: "cellular" when the
 * browser says so (or Data Saver is on), "unknown" on a phone that won't
 * say — Safari never does — and null on Wi-Fi, cable or a computer.
 */
export function meteredConnection(): "cellular" | "unknown" | null {
  const connection = (navigator as any).connection;
  if (connection?.type === "wifi" || connection?.type === "ethernet") {
    return null;
  }
  if (connection?.type === "cellular" || connection?.saveData) {
    return "cellular";
  }
  return isMobile() ? "unknown" : null;
}

/** The request in flight, so stopLocalModel can end it. */
let stopPending: ((_error: Error) => void) | null = null;

/** What the model wrote, and why it stopped ("length" means cut off). */
interface Completion {
  content: string;
  finish?: string;
}

/** One request to the worker; the model stays loaded there between calls. */
function complete(
  model: LocalModel,
  phase: "read" | "write" | "coach",
  request: object,
  onProgress: (_progress: AiProgress) => void,
): Promise<Completion> {
  worker ??= new Worker(new URL("./llm.worker.ts", import.meta.url), {
    type: "module",
  });
  const w = worker;
  // Leaving the page normally is not a crash.
  const clearRunning = () => storage.set(RUNNING_KEY, null);
  const markRunning = (at: AiProgress["phase"] | "coach") =>
    storage.set(RUNNING_KEY, JSON.stringify({ model: model.id, phase: at }));
  markRunning(phase);
  window.addEventListener("pagehide", clearRunning);
  let download = { progress: 0, elapsed: 0 };

  return new Promise<Completion>((resolve, reject) => {
    stopPending = reject;
    w.onmessage = ({ data }) => {
      if (data.type === "progress") {
        download = { progress: data.progress, elapsed: data.elapsed };
        onProgress({ phase: "download", ...download });
        markRunning(data.progress < 1 ? "download" : phase);
        if (data.progress >= 1) storage.set(DOWNLOADED_KEY, model.id);
      } else if (data.type === "retry") {
        onProgress({ phase: "download", ...download, retry: data.attempt });
      } else if (data.type === "done") {
        resolve({
          content: withoutThinking(data.content),
          finish: data.finish,
        });
      } else reject(new Error(data.message));
    };
    w.onerror = (event) => reject(new Error(event.message));
    w.postMessage({ model: model.id, request });
  }).finally(() => {
    stopPending = null;
    clearRunning();
    window.removeEventListener("pagehide", clearRunning);
  });
}

/**
 * Leaving the page mid-run: end the model rather than leave it busy on the
 * GPU behind whatever page comes next. What was in flight rejects with
 * "stopped", which is not a failure.
 */
export function stopLocalModel() {
  worker?.terminate();
  worker = null;
  stopPending?.(new Error("stopped"));
}

const thinkingOff = (model: LocalModel) =>
  // On a 4k context, thinking out loud spends the answer's budget before it
  // starts. Only Qwen may be sent this; it still opens each answer with an
  // empty think block, which complete() strips (withoutThinking).
  model.qwen ? { extra_body: { enable_thinking: false } } : {};

/**
 * A prompt the model's 4k context can't hold after all, which happens with
 * scripts and emoji that cost a token or more per character: run it again on
 * the latest 60% of the text. Over the limit was never by more than 15%.
 */
async function fitted<T>(run: (_cut: (_text: string) => string) => Promise<T>) {
  try {
    return await run((text) => text);
  } catch (error: any) {
    if (!isContextOverflow(String(error?.message))) throw error;
    return run((text) => text.slice(-Math.floor(text.length * 0.6)));
  }
}

/** Resolves once the page is in the foreground. */
const whenVisible = () =>
  new Promise<void>((resolve) => {
    if (!document.hidden) return resolve();
    const onChange = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", onChange);
      resolve();
    };
    document.addEventListener("visibilitychange", onChange);
  });

/**
 * One step, retried once if it failed while the page was in the background:
 * iOS stops the GPU when the visitor switches apps, and the step comes back
 * broken. `retryInvalid` also retries an answer that wasn't valid, which a
 * small model produces now and then in the foreground too.
 */
async function step<T>(
  run: () => Promise<T>,
  retryInvalid = false,
): Promise<T> {
  let wasHidden = document.hidden;
  const note = () => {
    if (document.hidden) wasHidden = true;
  };
  document.addEventListener("visibilitychange", note);
  try {
    return await run();
  } catch (error: any) {
    const invalid = error?.message === "local_invalid";
    if (!wasHidden && !(retryInvalid && invalid)) throw error;
    await whenVisible();
    return await run();
  } finally {
    document.removeEventListener("visibilitychange", note);
  }
}

export async function analyzeLocally(
  model: LocalModel,
  digest: ChatDigest,
  language: AiLanguage,
  onProgress: (_progress: AiProgress) => void,
  ask?: AiAsk,
): Promise<{ insights: ChatInsights; parts: string[] }> {
  // Line boundaries can leave one part over; the oldest goes, not the latest.
  const parts = splitParts(digest.transcript, model.partChars).slice(
    -model.maxParts,
  );

  // The first call also loads the model (a download, the first time). Report
  // that as such, and start the clock for the reading estimate once it's done.
  let readStart = performance.now();
  let current: AiProgress = { phase: "write", total: parts.length };
  const onLoad = (p: AiProgress) => {
    onProgress(p);
    if (p.phase === "download" && p.progress >= 1) {
      readStart = performance.now();
      onProgress(current);
    }
  };

  // A short chat is analyzed straight from the transcript. Up to half a
  // part: with the schema in the same prompt, a full part left the report
  // a few hundred tokens, and in German or Spanish it was cut off mid-list.
  let notes: string[] | undefined;
  if (parts.length > 1 || parts[0].length > model.partChars / 2) {
    notes = [];
    for (const [i, part] of parts.entries()) {
      current = {
        phase: "read",
        done: i,
        total: parts.length,
        elapsed: (performance.now() - readStart) / 1000,
      };
      onProgress(current);
      const note = await step(() =>
        fitted((cut) => {
          const { system, prompt } = buildNotesPrompt(
            digest,
            cut(part),
            i,
            parts.length,
            ask,
          );
          return complete(
            model,
            "read",
            {
              messages: [
                { role: "system", content: system },
                { role: "user", content: prompt },
              ],
              max_tokens: 180,
              temperature: 0.3,
              frequency_penalty: 0.4,
              ...thinkingOff(model),
            },
            onLoad,
          );
        }),
      );
      notes.push(note.content.trim());
    }
  }
  current = { phase: "write", total: parts.length };
  onProgress(current);

  const schema = JSON.stringify(z.toJSONSchema(insightsSchema));
  // Shortened only if the context can't hold it: notes never get that long.
  const shortened = (cut: (_text: string) => string) => ({
    ...digest,
    transcript: cut(digest.transcript),
  });
  // The report without the answer: the question gets its own call below.
  const insights = await step(async () => {
    const { content, finish } = await fitted((cut) => {
      const { system, prompt } = buildPrompt(
        shortened(cut),
        language,
        notes,
        // Who they are and the background, without the question.
        ask ? { me: ask.me, background: ask.background } : undefined,
      );
      return complete(
        model,
        "write",
        {
          messages: [
            {
              role: "system",
              content: `${system}\nAnswer with JSON matching this schema:\n${schema}`,
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object", schema },
          // A report in German or Spanish runs to ~1,000 tokens, which is
          // where this used to cut it off. Past what the context has left,
          // WebLLM stops on its own; readLocalReport keeps what's complete.
          max_tokens: 1600,
          temperature: 0.6,
          // The first phone report said "travel plans" once per person, three
          // times over. Penalising repeats is cheap and helps a 1B model most.
          frequency_penalty: 0.5,
          presence_penalty: 0.3,
          ...thinkingOff(model),
        },
        onLoad,
      );
    });
    const parsed = insightsSchema.safeParse(readLocalReport(content));
    if (!parsed.success) {
      throw Object.assign(new Error("local_invalid"), {
        finish,
        chars: content.length,
      });
    }
    return namePeopleByAlias(
      parsed.data,
      digest.participants.map((p) => p.alias),
    );
  }, true);

  if (ask?.question) {
    const reply = await step(() =>
      fitted((cut) => {
        const answer = buildAnswerPrompt(shortened(cut), language, notes, {
          ...ask,
          question: ask.question!,
        });
        return complete(
          model,
          "write",
          {
            messages: [
              { role: "system", content: answer.system },
              { role: "user", content: answer.prompt },
            ],
            max_tokens: 300,
            temperature: 0.5,
            frequency_penalty: 0.5,
            ...thinkingOff(model),
          },
          onLoad,
        );
      }),
    );
    insights.answer = reply.content;
  }

  return { insights, parts };
}

/**
 * Excerpt budget for a coach turn: half a part, leaving the rest of the 4k
 * context to the instructions, the report summary and the conversation.
 */
export const localCoachChars = (model: LocalModel) =>
  Math.floor(model.partChars / 2);

/** One coach turn on the device: short context, so only the latest turns. */
export async function coachLocally(
  model: LocalModel,
  digest: ChatDigest,
  language: AiLanguage,
  kind: CoachKind,
  history: CoachTurn[],
  options: { me?: string; context?: string; background?: string },
  onProgress: (_progress: AiProgress) => void,
): Promise<string> {
  // shortcut: the last 5 turns at 600 chars each is what fits next to the
  // excerpt; earlier turns are forgotten. Upgrade if models get more context.
  const recent = history
    .slice(-5)
    .map((turn) => ({ ...turn, content: turn.content.slice(0, 600) }));
  const reply = await step(() =>
    fitted((cut) => {
      const { system, messages } = buildCoachPrompt(
        { ...digest, transcript: cut(digest.transcript) },
        language,
        kind,
        recent,
        options,
      );
      return complete(
        model,
        "coach",
        {
          messages: [{ role: "system", content: system }, ...messages],
          max_tokens: 350,
          temperature: 0.5,
          frequency_penalty: 0.5,
          ...thinkingOff(model),
        },
        onProgress,
      );
    }),
  );
  return reply.content.trim();
}
