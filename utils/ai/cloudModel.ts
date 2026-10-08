import { httpsCallable } from "firebase/functions";
import type {
  AiAsk,
  AiLanguage,
  ChatDigest,
  ChatInsights,
} from "~/functions/src/ai/insights";

type Credentials = { email: string; subscriptionId: string };

/** Cloud analyses left today, and how many a day there are. */
export interface CloudAllowance {
  remaining: number;
  limit: number;
}

/**
 * The cloud half of the AI chat analysis, for subscribers. Sends the digest
 * (never the chat) to functions/src/ai/analyzeChatAi.ts, which runs whichever
 * model AI_MODEL names there. Errors come back as the function's message:
 * "not_subscribed", "daily_limit" or "analysis_failed".
 */
export async function analyzeInCloud(
  functions: unknown,
  credentials: Credentials,
  digest: ChatDigest,
  language: AiLanguage,
  ask?: AiAsk,
): Promise<{ insights: ChatInsights; allowance: CloudAllowance }> {
  const callable = httpsCallable<
    unknown,
    { insights: ChatInsights; remaining: number; limit: number }
  >(functions as any, "analyzeChatAi", { timeout: 300_000 });
  const { data } = await callable({ ...credentials, digest, language, ask });
  return {
    insights: data.insights,
    allowance: { remaining: data.remaining, limit: data.limit },
  };
}

export async function getCloudAllowance(
  functions: unknown,
  credentials: Credentials,
): Promise<CloudAllowance> {
  const callable = httpsCallable<Credentials, CloudAllowance>(
    functions as any,
    "getAiAllowance",
  );
  return (await callable(credentials)).data;
}
