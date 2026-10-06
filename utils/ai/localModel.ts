import { z } from "zod";
import {
  buildPrompt,
  insightsSchema,
  type AiLanguage,
  type ChatDigest,
  type ChatInsights,
} from "~/functions/src/ai/insights";

/**
 * The private half of the AI chat analysis: a small open model (Qwen3.5 2B)
 * downloaded once into the browser cache and run on the device's GPU through
 * WebLLM. Nothing leaves the device; the price is a ~1.3 GB first download
 * and a model far less perceptive than the cloud one.
 *
 * Same prompt and schema as the cloud (functions/src/ai/insights.ts). The
 * model's context is 4k tokens, so it gets a much shorter transcript, and the
 * schema is spelled out in the prompt because a model this size needs telling
 * what each field is for — the grammar alone only keeps the JSON valid.
 */

/** ~1.7k tokens of transcript, leaving room for the prompt and the answer. */
export const LOCAL_TRANSCRIPT_CHARS = 5_000;
export const LOCAL_DOWNLOAD_GB = 1.3;

const MODEL_F16 = "Qwen3.5-2B-q4f16_1-MLC";
const MODEL_F32 = "Qwen3.5-2B-q4f32_1-MLC";

let worker: Worker | null = null;

/** Can this browser run the model at all? WebGPU is the whole requirement. */
export async function supportsLocalModel(): Promise<boolean> {
  const gpu = (navigator as any).gpu;
  if (!gpu) return false;
  try {
    return !!(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

async function pickModel(): Promise<string> {
  const adapter = await (navigator as any).gpu.requestAdapter();
  return adapter?.features?.has("shader-f16") ? MODEL_F16 : MODEL_F32;
}

/** One request to the worker; the model stays loaded there between calls. */
function complete(
  model: string,
  request: object,
  onProgress: (_progress: number) => void,
): Promise<string> {
  worker ??= new Worker(new URL("./llm.worker.ts", import.meta.url), {
    type: "module",
  });
  const w = worker;
  return new Promise((resolve, reject) => {
    w.onmessage = ({ data }) => {
      if (data.type === "progress") onProgress(data.progress);
      else if (data.type === "done") resolve(data.content);
      else reject(new Error(data.message));
    };
    w.onerror = (event) => reject(new Error(event.message));
    w.postMessage({ model, request });
  });
}

export async function analyzeLocally(
  digest: ChatDigest,
  language: AiLanguage,
  onProgress: (_progress: number) => void,
): Promise<ChatInsights> {
  const schema = JSON.stringify(z.toJSONSchema(insightsSchema));
  const { system, prompt } = buildPrompt(digest, language);

  const content = await complete(
    await pickModel(),
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
      // Qwen thinks out loud by default; on a 4k context that is the answer's
      // budget gone before it starts.
      extra_body: { enable_thinking: false },
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
