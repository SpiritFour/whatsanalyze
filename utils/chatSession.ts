const CHAT_SESSION_KEY = "whatsanalyze_active_chat";

export interface PersistedChatSession {
  messages: any[];
  attachments?: any[];
  updatedAt: number;
}

export const saveChatSession = (chatObject: {
  messages: any[];
  attachments?: any[];
}) => {
  if (typeof window === "undefined" || !chatObject?.messages?.length) return;
  try {
    // Only store metadata + message objects without heavy blobs to stay within storage limits
    const safeAttachments = (chatObject.attachments || []).map((att: any) => ({
      name: att.name,
    }));

    const session: PersistedChatSession = {
      messages: chatObject.messages,
      attachments: safeAttachments,
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn("Failed to persist chat session:", err);
  }
};

export const loadChatSession = (): PersistedChatSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHAT_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PersistedChatSession;
    // Keep session valid for up to 6 hours across checkout redirects
    if (Date.now() - session.updatedAt > 6 * 3600 * 1000) {
      clearChatSession();
      return null;
    }

    // JSON has no date type, so every message came back with `date` as a
    // string. The analyzer calls Date methods on it, so without reviving them
    // the restored chat throws on the first chart and the page renders blank.
    const messages = (session.messages || []).map((message: any) => ({
      ...message,
      date: new Date(message.date),
    }));

    if (messages.some((message) => Number.isNaN(message.date.getTime()))) {
      console.warn("Persisted chat session has unreadable dates, dropping it.");
      clearChatSession();
      return null;
    }

    return { ...session, messages };
  } catch (err) {
    console.warn("Failed to load persisted chat session:", err);
    return null;
  }
};

export const clearChatSession = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHAT_SESSION_KEY);
  } catch (err) {
    console.warn("Failed to clear chat session:", err);
  }
};
