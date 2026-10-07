import { HttpsError, onCall } from "firebase-functions/https";
import {
  defineInt,
  defineSecret,
  defineString,
} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { generateText, Output, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { db } from "../firebase";
import { lookupSubscription } from "../stripe/verifySubscription";
import {
  lookupPaypalSubscription,
  paypalSecret,
} from "../paypal/verifyPaypalSubscription";
import {
  AI_LANGUAGES,
  CLOUD_TRANSCRIPT_CHARS,
  MAX_QUESTION_CHARS,
  buildPrompt,
  insightsSchema,
} from "./insights";

/**
 * The cloud half of the AI chat analysis: subscribers only.
 *
 * Provider-agnostic on purpose. `AI_MODEL` names the model as
 * "<provider>:<model id>" and `AI_API_KEY` is that provider's key, so moving
 * between Anthropic and OpenAI is a config change and a redeploy:
 *
 *   AI_MODEL=openai:gpt-6-luna         (~1 cent, ~12 s for 30k tokens at low)
 *   AI_MODEL=anthropic:claude-sonnet-5 (~25 cents: priced for 10x the input)
 *
 * AI_REASONING_EFFORT is passed to whichever provider runs: OpenAI's
 * reasoningEffort, Anthropic's effort. Both take low…max.
 *
 * The browser never sends the raw chat, only the digest built in
 * utils/ai/digest.js: excerpts with names, numbers, emails and links already
 * replaced. Nothing here stores it.
 */

const aiModel = defineString("AI_MODEL", { default: "openai:gpt-6-luna" });
// "low": max took over 3 minutes on a 34k-token chat, low takes ~12 s with
// answers just as specific. Raise it only with the wait in mind.
const aiReasoningEffort = defineString("AI_REASONING_EFFORT", {
  default: "low",
});
const aiApiKey = defineSecret("AI_API_KEY");
/** Analyses per subscriber per UTC day. The cost ceiling, not a feature. */
const aiDailyLimit = defineInt("AI_DAILY_LIMIT", { default: 10 });

const PAYPAL_SUBSCRIPTION_ID = /^I-[A-Z0-9]+$/i;

const requestSchema = z.object({
  email: z.string().min(1),
  subscriptionId: z.string().min(1),
  language: z.enum(Object.keys(AI_LANGUAGES) as [keyof typeof AI_LANGUAGES]),
  digest: z.object({
    participants: z
      .array(z.object({ alias: z.string().max(20), messages: z.number() }))
      .max(50),
    totalMessages: z.number(),
    firstDate: z.string().max(30),
    lastDate: z.string().max(30),
    transcript: z.string().min(1).max(CLOUD_TRANSCRIPT_CHARS),
  }),
  ask: z
    .object({
      question: z.string().max(MAX_QUESTION_CHARS).optional(),
      me: z.string().max(20).optional(),
    })
    .optional(),
});

function languageModel(spec: string, apiKey: string): LanguageModel {
  const separator = spec.indexOf(":");
  const provider = spec.slice(0, separator);
  const modelId = spec.slice(separator + 1);
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    default:
      throw new Error(`Unknown AI provider in AI_MODEL: "${spec}"`);
  }
}

async function isSubscriber(email: string, subscriptionId: string) {
  const result = PAYPAL_SUBSCRIPTION_ID.test(subscriptionId)
    ? await lookupPaypalSubscription(subscriptionId)
    : await lookupSubscription(email, subscriptionId);
  return result.isValid;
}

/** Count this analysis against today's allowance; false once it is used up. */
async function takeFromAllowance(subscriptionId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const ref = db.collection("aiUsage").doc(subscriptionId);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const used = doc.data()?.day === today ? (doc.data()?.count ?? 0) : 0;
    if (used >= aiDailyLimit.value()) return false;
    tx.set(ref, { day: today, count: used + 1 });
    return true;
  });
}

export const analyzeChatAi = onCall(
  {
    cors: true,
    secrets: [aiApiKey, paypalSecret],
    // ~12 s typically; the headroom is for a slow provider or a higher effort.
    timeoutSeconds: 300,
    // Several visitors waiting on a model at once is normal here, and each
    // one costs a container nothing while it waits.
    maxInstances: 3,
  },
  async (request) => {
    const parsed = requestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", "Malformed analysis request");
    }
    const { email, subscriptionId, language, digest, ask } = parsed.data;

    if (!(await isSubscriber(email, subscriptionId))) {
      throw new HttpsError("permission-denied", "not_subscribed");
    }
    if (!(await takeFromAllowance(subscriptionId))) {
      throw new HttpsError("resource-exhausted", "daily_limit");
    }

    const startedAt = Date.now();
    try {
      const { system, prompt } = buildPrompt(digest, language, undefined, ask);
      const { output, usage } = await generateText({
        model: languageModel(aiModel.value(), aiApiKey.value()),
        system,
        prompt,
        output: Output.object({ schema: insightsSchema }),
        providerOptions: {
          openai: { reasoningEffort: aiReasoningEffort.value() },
          anthropic: { effort: aiReasoningEffort.value() },
        },
      });
      logger.info("AI analysis done", {
        model: aiModel.value(),
        durationMs: Date.now() - startedAt,
        effort: aiReasoningEffort.value(),
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      });
      return { insights: output, model: aiModel.value() };
    } catch (error: any) {
      logger.error("AI analysis failed", {
        model: aiModel.value(),
        error: error.message,
      });
      throw new HttpsError("internal", "analysis_failed");
    }
  },
);
