import { parseString } from "whatsapp-chat-parser";
import JSZip from "jszip";
import {
  formatTimeAgo as formatTimeAgoUtil,
  formatDuration as formatDurationUtil,
  analyzeInactivity as analyzeInactivityUtil,
} from "~/utils/inactivity";
export interface ChatMessage {
  date: Date;
  author: string;
  message: string;
  attachment?: {
    fileName: string;
  };
}

export interface ParticipantInactivity {
  name: string;
  messageCount: number;
  lastMessage: {
    date: Date;
    message: string;
  };
  timeSinceLastMs: number;
  timeSinceLastFormatted: string;
  avgResponseTimeMs: number;
  avgResponseTimeFormatted: string;
  conversationStartersCount: number;
  conversationStartersPct: number;
}

export interface InactivityGap {
  durationMs: number;
  durationFormatted: string;
  startDate: Date;
  endDate: Date;
  brokenBy: string;
  messageBefore: string;
  messageAfter: string;
}

export interface ChatInactivityAnalysis {
  lastMessage: {
    author: string;
    date: Date;
    message: string;
  };
  timeSinceLastMs: number;
  timeSinceLastFormatted: string;
  inactivityStatus: "active" | "dormant" | "inactive" | "ghosted";
  inactivityStatusLabel: string;
  inactivityStatusBadge: string;
  inactivityColor: string;
  participants: ParticipantInactivity[];
  longestGaps: InactivityGap[];
  conversationInitiations: {
    total: number;
    breakdown: Array<{ author: string; count: number; percentage: number }>;
  };
  totalMessages: number;
  dateRange: {
    start: Date;
    end: Date;
    totalDays: number;
  };
  parseDurationMs: number;
}

export interface ChatAttachment {
  name: string;
  compressedContent: unknown;
}

export interface SharedChatState {
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  sourceName?: string;
}

export const useSharedChat = () => {
  return useState<SharedChatState | null>("shared_chat_data", () => null);
};

export function formatTimeAgo(date: Date, referenceDate = new Date()): string {
  return formatTimeAgoUtil(date, referenceDate);
}

export function formatDuration(ms: number): string {
  return formatDurationUtil(ms);
}

export function analyzeInactivity(
  messages: ChatMessage[],
  parseDurationMs = 0
): ChatInactivityAnalysis | null {
  return analyzeInactivityUtil(
    messages,
    parseDurationMs
  ) as ChatInactivityAnalysis | null;
}

// Extractor helper to parse a File (.txt or .zip) or string
export async function parseChatFile(
  fileOrText: File | string
): Promise<{
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  durationMs: number;
}> {
  const startTime = performance.now();

  if (typeof fileOrText === "string") {
    const messages = (await parseString(fileOrText, {
      parseAttachments: true,
    })) as ChatMessage[];
    const durationMs = Math.round(performance.now() - startTime);
    return { messages, attachments: [], durationMs };
  }

  // File instance
  const isZip =
    fileOrText.name.toLowerCase().endsWith(".zip") ||
    fileOrText.type.includes("zip");

  if (isZip) {
    const arrayBuffer = await fileOrText.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Look for _chat.txt or any .txt file in zip
    let chatFile: JSZip.JSZipObject | null = zip.file("_chat.txt");
    if (!chatFile) {
      chatFile =
        Object.values(zip.files).find(
          (f) => f.name.endsWith(".txt") && !f.dir
        ) || null;
    }
    if (!chatFile) {
      throw new Error(
        "No WhatsApp chat .txt file found inside this ZIP archive."
      );
    }

    const textContent = await chatFile.async("string");
    const messages = (await parseString(textContent, {
      parseAttachments: true,
    })) as ChatMessage[];

    const attachments: ChatAttachment[] = Object.values(zip.files)
      .filter((f) => !f.name.endsWith(".txt") && !f.dir)
      .map((f) => {
        const zipEntry = (f as unknown) as {
          _data?: { compressedContent?: unknown };
        };
        return {
          name: f.name,
          compressedContent: zipEntry._data?.compressedContent,
        };
      });

    const durationMs = Math.round(performance.now() - startTime);
    return { messages, attachments, durationMs };
  } else {
    const textContent = await fileOrText.text();
    const messages = (await parseString(textContent, {
      parseAttachments: true,
    })) as ChatMessage[];
    const durationMs = Math.round(performance.now() - startTime);
    return { messages, attachments: [], durationMs };
  }
}
