import { httpsCallable } from "firebase/functions";
import type {
  AiLanguage,
  ChatDigest,
  ChatInsights,
} from "~/functions/src/ai/insights";

/**
 * The cloud half of the AI chat analysis, for subscribers. Sends the digest
 * (never the chat) to functions/src/ai/analyzeChatAi.ts, which runs whichever
 * model AI_MODEL names there. Errors come back as the function's message:
 * "not_subscribed", "daily_limit" or "analysis_failed".
 */
export async function analyzeInCloud(
  functions: unknown,
  credentials: { email: string; subscriptionId: string },
  digest: ChatDigest,
  language: AiLanguage,
): Promise<ChatInsights> {
  const callable = httpsCallable<
    unknown,
    { insights: ChatInsights; model: string }
  >(functions as any, "analyzeChatAi", { timeout: 180_000 });
  const { data } = await callable({ ...credentials, digest, language });
  return data.insights;
}
