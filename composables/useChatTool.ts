import { parseString } from "whatsapp-chat-parser";
import JSZip from "jszip";
import { markSystemMessages } from "~/utils/systemMessages";
import { zipFileToAttachment } from "~/utils/attachments";
export interface ChatMessage {
  date: Date;
  author: string;
  message: string;
  attachment?: {
    fileName: string;
  };
  /** Position in the export, so grouping can be undone. */
  absolute_id?: number;
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
  compressedContent?: unknown;
  decompressedData?: unknown;
}

export interface SharedChatState {
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  sourceName?: string;
}

export const useSharedChat = () => {
  return useState<SharedChatState | null>("shared_chat_data", () => null);
};

export {
  analyzeInactivity,
  formatDuration,
  formatTimeAgo,
} from "~/utils/inactivity";
export { analyzeMessages } from "~/utils/messageCounter";
export { analyzeWords } from "~/utils/wordCounter";
export { analyzeHeatmap } from "~/utils/chatHeatmap";

export interface ParsedChat {
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  durationMs: number;
}

/** Names a file the way WhatsApp names its chat export. */
const CHAT_FILE = /.*(?:chat|whatsapp).*\.txt$/i;

/**
 * Turn the text of an export into messages.
 *
 * Everything the rest of the site assumes about a message is applied here, so
 * there is one answer to what a parsed chat looks like no matter which upload
 * surface produced it:
 *
 * - authors are trimmed. WhatsApp exports a contact's name exactly as it is
 *   stored, so one saved as "John Doe " keeps that trailing space into every
 *   quote, label and file name built from it;
 * - system messages are marked, so the encryption notice is not read as the
 *   first thing a participant said;
 * - `absolute_id` records the original order, which transformChatData sorts
 *   back to after grouping.
 */
async function parseChatText(text: string): Promise<ChatMessage[]> {
  const messages = (await parseString(text, {
    parseAttachments: true,
  })) as ChatMessage[];

  markSystemMessages(messages);

  return messages.map((message, index) => ({
    ...message,
    author:
      typeof message.author === "string"
        ? message.author.trim()
        : message.author,
    absolute_id: index,
  }));
}

/** Is this a zip, by either of the two things a browser will tell us? */
export const isZipFile = (file: File): boolean =>
  /^application\/(?:x-)?zip(?:-compressed)?$/.test(file.type) ||
  file.name.toLowerCase().endsWith(".zip");

/**
 * The chat export inside an archive. `_chat.txt` is what iOS writes; other
 * exports vary, so fall back to the shortest chat-shaped name — a longer one
 * is usually a copy like "WhatsApp Chat with Bob (2).txt".
 */
async function findChatFileInZip(zip: JSZip): Promise<string> {
  const direct = zip.file("_chat.txt");
  if (direct) return direct.async("string");

  const candidates = zip
    .file(CHAT_FILE)
    .sort((a, b) => a.name.length - b.name.length);
  if (candidates.length) return candidates[0].async("string");

  // Some exports name the file after the contact alone. Any .txt beats
  // failing outright.
  const anyText = Object.values(zip.files).find(
    (f) => !f.dir && f.name.toLowerCase().endsWith(".txt")
  );
  if (anyText) return anyText.async("string");

  throw new Error("No WhatsApp chat .txt file found inside this ZIP archive.");
}

/**
 * Parse a chat export: the raw text, a .txt file, or the .zip WhatsApp
 * produces when the export includes media.
 *
 * This is the only chat parser on the site. The homepage dropzone, the PWA
 * share target and every /tools page go through it, so a zip that opens on one
 * of them opens on all of them.
 */
export async function parseChatFile(
  fileOrText: File | string
): Promise<ParsedChat> {
  const startTime = performance.now();
  const done = (
    messages: ChatMessage[],
    attachments: ChatAttachment[] = []
  ): ParsedChat => ({
    messages,
    attachments,
    durationMs: Math.round(performance.now() - startTime),
  });

  if (typeof fileOrText === "string") {
    return done(await parseChatText(fileOrText));
  }

  if (!isZipFile(fileOrText)) {
    return done(await parseChatText(await fileOrText.text()));
  }

  const arrayBuffer = await fileOrText.arrayBuffer();
  // An empty or unreadable file blows up deep inside JSZip with "Can't read
  // the data of 'the loaded zip file'" — fail with something sayable instead.
  if (!arrayBuffer.byteLength) {
    throw new Error("empty_zip");
  }

  const zip = await JSZip.loadAsync(arrayBuffer);
  const messages = await parseChatText(await findChatFileInZip(zip));
  const attachments: ChatAttachment[] = Object.values(zip.files)
    .filter((f) => !f.dir && !f.name.toLowerCase().endsWith(".txt"))
    .map((f) => zipFileToAttachment(f as any));

  return done(messages, attachments);
}

/**
 * Parse a set of loose files, which is how the PWA share target and a
 * multi-file drop arrive: one chat export plus its media, already inflated by
 * the browser rather than packed in an archive.
 */
export async function parseSharedFiles(
  fileList: FileList | File[]
): Promise<ParsedChat> {
  const startTime = performance.now();
  const files = Array.from(fileList);

  const chatFile =
    files.find((file) => CHAT_FILE.test(file.name)) ||
    files.find((file) => file.name.toLowerCase().endsWith(".txt"));
  if (!chatFile) {
    throw new Error("no_chat_file");
  }

  const messages = await parseChatText(await chatFile.text());

  // Every non-chat file becomes an attachment. These are already decompressed,
  // which is the only way they differ from the ones inside a zip.
  const attachments: ChatAttachment[] = await Promise.all(
    files
      .filter((file) => file !== chatFile)
      .map(async (file) => ({
        name: file.name,
        decompressedData: new Uint8Array(await file.arrayBuffer()),
      }))
  );

  return {
    messages,
    attachments,
    durationMs: Math.round(performance.now() - startTime),
  };
}
