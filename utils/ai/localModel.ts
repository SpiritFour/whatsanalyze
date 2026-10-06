import { z } from "zod";
import {
  buildPrompt,
  insightsSchema,
  type AiLanguage,
  type ChatDigest,
  type ChatInsights,
} from "~/functions/src/ai/insights";

/**
 * The private half of the AI chat analysis: a small open model downloaded
 * once into the browser cache and run on the device's GPU through WebLLM.
 * Nothing leaves the device; the price is a one-time download and a model far
 * less perceptive than the cloud one.
 *
 * Same prompt and schema as the cloud (functions/src/ai/insights.ts). The
 * models' context is 4k tokens, so they get a much shorter transcript, and the
 * schema is spelled out in the prompt because a model this size needs telling
 * what each field is for — the grammar alone only keeps the JSON valid.
 */

export interface LocalModel {
  id: string;
  /** Download size, measured from the files on Hugging Face. */
  downloadMb: number;
  /** Transcript budget: what fits the 4k context next to prompt and answer. */
  transcriptChars: number;
  /** Qwen thinks out loud unless told not to; other models have no switch. */
  qwen: boolean;
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
  transcriptChars: 5_000,
  qwen: true,
});
const MOBILE = (f16: boolean): LocalModel => ({
  id: f16
    ? "Llama-3.2-1B-Instruct-q4f16_1-MLC"
    : "Llama-3.2-1B-Instruct-q4f32_1-MLC",
  downloadMb: 705,
  transcriptChars: 4_000,
  qwen: false,
});

/** How far the model load is: 0–1, and seconds since it started. */
export interface LoadProgress {
  progress: number;
  elapsed: number;
}

/**
 * Set once the model has loaded here, so a returning visitor isn't warned
 * about a download that won't happen. WebLLM keeps the weights in Cache
 * Storage; clearing site data clears both.
 */
const DOWNLOADED_KEY = "whatsanalyze_ai_model";
/**
 * Set while the model runs. A tab the OS kills for memory gets no chance to
 * clear it, so finding it on the next visit means the last attempt crashed.
 */
const RUNNING_KEY = "whatsanalyze_ai_running";

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

/** Can this browser run a model at all? WebGPU is the whole requirement. */
export async function supportsLocalModel(): Promise<boolean> {
  const gpu = (navigator as any).gpu;
  if (!gpu) return false;
  try {
    return !!(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

/** The model this device should run. */
export async function pickLocalModel(): Promise<LocalModel> {
  const adapter = await (navigator as any).gpu?.requestAdapter();
  const f16 = !!adapter?.features?.has("shader-f16");
  return isMobile() ? MOBILE(f16) : DESKTOP(f16);
}

/** Has this model already been downloaded into this browser? */
export function isModelDownloaded(model: LocalModel): boolean {
  return storage.get(DOWNLOADED_KEY) === model.id;
}

/**
 * Did the last on-device run die with the tab? Reading the answer clears it,
 * so one crash is reported once.
 */
export function takeCrashedRun(): boolean {
  const crashed = storage.get(RUNNING_KEY) !== null;
  storage.set(RUNNING_KEY, null);
  return crashed;
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

/** One request to the worker; the model stays loaded there between calls. */
function complete(
  model: LocalModel,
  request: object,
  onProgress: (_progress: LoadProgress) => void,
): Promise<string> {
  worker ??= new Worker(new URL("./llm.worker.ts", import.meta.url), {
    type: "module",
  });
  const w = worker;
  // Leaving the page normally is not a crash.
  const clearRunning = () => storage.set(RUNNING_KEY, null);
  storage.set(RUNNING_KEY, model.id);
  window.addEventListener("pagehide", clearRunning);

  return new Promise<string>((resolve, reject) => {
    w.onmessage = ({ data }) => {
      if (data.type === "progress") {
        onProgress(data);
        if (data.progress >= 1) storage.set(DOWNLOADED_KEY, model.id);
      } else if (data.type === "done") resolve(data.content);
      else reject(new Error(data.message));
    };
    w.onerror = (event) => reject(new Error(event.message));
    w.postMessage({ model: model.id, request });
  }).finally(() => {
    clearRunning();
    window.removeEventListener("pagehide", clearRunning);
  });
}

export async function analyzeLocally(
  model: LocalModel,
  digest: ChatDigest,
  language: AiLanguage,
  onProgress: (_progress: LoadProgress) => void,
): Promise<ChatInsights> {
  const schema = JSON.stringify(z.toJSONSchema(insightsSchema));
  const { system, prompt } = buildPrompt(digest, language);

  const content = await complete(
    model,
    {
      messages: [
        {
          role: "system",
          content: `${system}\nAnswer with JSON matching this schema:\n${schema}`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object", schema },
      max_tokens: 1200,
      temperature: 0.6,
      // On a 4k context, thinking out loud spends the answer's budget before
      // it starts. WebLLM prepends an empty think block for this, so only
      // Qwen may be sent it.
      ...(model.qwen ? { extra_body: { enable_thinking: false } } : {}),
    },
    onProgress,
  );

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error("local_invalid");
  }
  const parsed = insightsSchema.safeParse(json);
  if (!parsed.success) throw new Error("local_invalid");
  return parsed.data;
}
