import { computed } from "vue";
import type {
  ChatAttachment,
  ChatMessage,
  ChatSource,
  SharedChatState,
} from "~/composables/useChatTool";
import {
  analyticsLibrary,
  type LibraryNotKeptReason,
} from "~/composables/useAnalytics";
import { isAiReport, type AiReport } from "~/utils/ai/report";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { clearChatSession, loadChatSession } from "~/utils/chatSession";
import { clearUpload, loadUpload } from "~/utils/uploadStore";
import { libraryExists } from "~/utils/library/database";
import {
  backupFileName,
  hashText,
  isBackupName,
  streamKey,
} from "~/utils/library/identity";

/**
 * Saved chats, for the pages (docs/saved-chats.md): the list, saving by
 * default, opening, forgetting, the tab's active chat, and what each chat
 * keeps (AI readings, coach conversations, "me", the last tool).
 *
 * Every upload is saved on this device, and nowhere else. Where the browser
 * refuses (some private windows, blocked storage, a full disk) the chat stays
 * for the tab only, as it did before, and the page says so.
 *
 * The database itself (utils/library/) is loaded on first use: IndexedDB and
 * gzip are only needed by visitors who keep a chat. Open tabs stay in step
 * through a BroadcastChannel.
 */

export interface SavedSource {
  name: string | null;
  size: number | null;
  sha256: string | null;
  firstDate: number | null;
  lastDate: number | null;
  messages: number;
  importedAt: number;
}

/** A saved chat's record: everything the list shows, none of the messages. */
export interface SavedChat {
  id: string;
  version: number;
  /** From the export's name; null when that names nobody ("_chat.txt"). */
  title: string | null;
  /** By how much each wrote, most first. */
  participants: string[];
  aliases: Record<string, string>;
  /** Which participant the visitor is, once they said. */
  me: string | null;
  isGroup: boolean;
  firstDate: number | null;
  lastDate: number | null;
  streamKey: string;
  counts: {
    messages: number;
    total: number;
    attachments: number;
    months: number;
    bytes?: number;
  };
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  /** The cleaned-up path (utils/cleanPath.js) of the tool it was last used in. */
  lastTool: string | null;
  locked: boolean;
  sources: SavedSource[];
  /** Wrapped years already unwrapped, which don't cost a free analysis again. */
  wrappedYears: number[];
}

/** A saved chat opened for a page: the record, and the chat as the parser left it. */
export interface OpenedChat {
  id: string;
  chat: SavedChat;
  messages: ChatMessage[];
  /** Names only: the media stays in the export, which is never kept. */
  attachments: ChatAttachment[];
  source: ChatSource | null;
  /** What the page shows as the file's name. */
  sourceName: string | null;
}

export interface SavedReading {
  id: string;
  createdAt: number;
  report: AiReport;
}

/** A chat to keep: what the parser produced, and the name it was uploaded under. */
export interface KeepInput {
  messages: ChatMessage[];
  source?: ChatSource | null;
  sourceName?: string | null;
  /** The sample chat is never kept. */
  sample?: boolean;
}

export interface LibrarySettings {
  autoForget: boolean;
}

/** One turn of a coach conversation (components/ai/AiCoach.vue), kept as JSON. */
export type CoachTurnRecord = Record<string, unknown>;

const READING = "ai-reading";
const COACH = "coach";
const DAY = 86_400_000;
/** The tab's active chat: which saved chat a reload in this tab reopens. */
const ACTIVE_KEY = "whatsanalyze_library_active";
const CHANNEL = "whatsanalyze_library";

const library = () => import("~/utils/library");

// One per tab, like the database connection.
let loading: Promise<void> | null = null;
let channel: BroadcastChannel | null = null;
let persistAsked = false;
const saving = new Map<string, Promise<string | null>>();
const keys = new WeakMap<object, string>();

/** A chat's stream key (utils/library/identity.js), worked out once per message list. */
function keyOf(messages: ChatMessage[]): string {
  let key = keys.get(messages);
  if (!key) {
    key = streamKey(messages) as string;
    keys.set(messages, key);
  }
  return key;
}

/** Reactive data, Vue proxies included, as the plain JSON IndexedDB can store. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const daysSince = (time: number | null | undefined) =>
  time ? Math.max(0, Math.floor((Date.now() - time) / DAY)) : 0;

/** Firefox asks the visitor before storage is made persistent; the others decide quietly. */
const isFirefox = () =>
  typeof navigator !== "undefined" && /\bFirefox\//.test(navigator.userAgent);

function notKeptReason(error: unknown): LibraryNotKeptReason {
  const name = (error as { name?: string } | null)?.name;
  if (name === "QuotaExceededError") return "quota";
  if (
    typeof indexedDB === "undefined" ||
    [
      "SecurityError",
      "InvalidStateError",
      "UnknownError",
      "NotAllowedError",
    ].includes(name ?? "")
  ) {
    return "unavailable";
  }
  return "error";
}

function present(opened: {
  chat: SavedChat;
  messages: ChatMessage[];
}): OpenedChat {
  const latest = opened.chat.sources?.at(-1);
  return {
    id: opened.chat.id,
    chat: opened.chat,
    messages: opened.messages,
    attachments: opened.messages
      .filter((message) => message.attachment?.fileName)
      .map((message) => ({ name: message.attachment!.fileName })),
    source: latest
      ? {
          name: latest.name ?? "",
          size: latest.size ?? 0,
          sha256: latest.sha256,
        }
      : null,
    sourceName: latest?.name ?? opened.chat.title,
  };
}

export function useLibrary() {
  const chats = useState<SavedChat[]>("library_chats", () => []);
  /** True once the list has been read (or there turned out to be none). */
  const ready = useState<boolean>("library_ready", () => false);
  /** False once the browser refused storage; null until it was asked. */
  const available = useState<boolean | null>("library_available", () => null);
  const activeId = useState<string | null>("library_active", () => null);
  /** Stream keys of the chats being saved right now. */
  const pending = useState<string[]>("library_pending", () => []);
  /** Why a chat (by stream key) could not be kept. */
  const failures = useState<Record<string, LibraryNotKeptReason>>(
    "library_failures",
    () => ({}),
  );
  const settings = useState<LibrarySettings>("library_settings", () => ({
    autoForget: false,
  }));
  const persisted = useState<boolean | null>("library_persisted", () => null);
  /** The privacy panel (components/library/LibraryPanel.vue). */
  const panel = useState<{ open: boolean; chatId: string | null }>(
    "library_panel",
    () => ({ open: false, chatId: null }),
  );
  // useSharedChat's state, read by key: composables/useChatTool.ts brings the
  // parser and JSZip along, which every page would then load.
  const sharedChat = useState<SharedChatState | null>("shared_chat_data");

  const byKey = computed(
    () => new Map(chats.value.map((chat) => [chat.streamKey, chat])),
  );

  // -- the tab's active chat -------------------------------------------------

  function setActive(id: string | null) {
    activeId.value = id;
    try {
      if (id) sessionStorage.setItem(ACTIVE_KEY, id);
      else sessionStorage.removeItem(ACTIVE_KEY);
    } catch {
      // Storage blocked: a reload just won't find it.
    }
  }

  const clearActive = () => setActive(null);

  // -- reading the list ---------------------------------------------------

  async function refresh() {
    try {
      // After "Forget everything" in another tab there is no database, and
      // asking for its list would make a new, empty one.
      if ((await libraryExists()) === false) {
        chats.value = [];
        return;
      }
      chats.value = await (await library()).listChats();
    } catch (error) {
      console.warn("Could not read the saved chats:", error);
    }
  }

  /** Copies of these chats outside the library: this tab's, for "Forget". */
  function forgetTabCopies(forgotten: SavedChat[]) {
    const gone = new Set(forgotten.map((chat) => chat.streamKey));
    const session = loadChatSession();
    if (session?.messages?.length && gone.has(keyOf(session.messages))) {
      dropTabReport(chatFingerprint({ chatObject: session.messages }));
      clearChatSession();
    }
    if (
      sharedChat.value?.messages?.length &&
      gone.has(keyOf(sharedChat.value.messages))
    ) {
      sharedChat.value = null;
    }
    // The export the court pages keep for the tab (utils/uploadStore.ts).
    void loadUpload().then((file) => {
      const kept = forgotten.some((chat) =>
        chat.sources?.some(
          (s) => s.name === file?.name && s.size === file?.size,
        ),
      );
      if (file && kept) return clearUpload();
    });
  }

  /** Everything any page keeps about a chat for the tab: "Forget everything". */
  function forgetAllTabCopies() {
    clearChatSession();
    void clearUpload();
    sharedChat.value = null;
    try {
      // The AI page's reading of an unsaved chat (REPORT_KEY in
      // pages/tools/ai-chat-analyzer.vue) and the Wrapped story
      // (stores/wrapped/stats.ts, persisted under its store id).
      sessionStorage.removeItem("ai-report");
      sessionStorage.removeItem("stats");
    } catch {
      // Storage blocked: there is nothing in it either.
    }
  }

  /** The AI page's tab-only reading, if it is about this chat. */
  function dropTabReport(fingerprint: string | null) {
    try {
      const saved = JSON.parse(sessionStorage.getItem("ai-report") ?? "null");
      if (saved?.chat === fingerprint) sessionStorage.removeItem("ai-report");
    } catch {
      // Unreadable or blocked: nothing to drop.
    }
  }

  function post(message: object) {
    channel?.postMessage(message);
  }

  function listen() {
    if (channel || typeof BroadcastChannel === "undefined") return;
    channel = new BroadcastChannel(CHANNEL);
    // Another tab saved, opened or forgot something: catch up.
    channel.onmessage = ({ data }) => {
      if (data?.type === "cleared") {
        chats.value = [];
        settings.value = { autoForget: false };
        clearActive();
        forgetAllTabCopies();
        return;
      }
      if (data?.type === "forgotten") {
        const forgotten = chats.value.filter((chat) =>
          data.ids?.includes(chat.id),
        );
        if (activeId.value && data.ids?.includes(activeId.value)) {
          clearActive();
        }
        if (data.wipe) forgetTabCopies(forgotten);
      }
      void refresh();
    };
  }

  /**
   * Read the list, once per tab. With "Forget chats not opened in 90 days"
   * on, the old ones go first, so the list never shows them.
   */
  function load(): Promise<void> {
    if (!import.meta.client) return Promise.resolve();
    loading ??= (async () => {
      try {
        activeId.value = sessionStorage.getItem(ACTIVE_KEY);
      } catch {
        // Storage blocked: no active chat to come back to.
      }
      listen();
      try {
        if ((await libraryExists()) === false) return;
        const lib = await library();
        settings.value = await lib.readSettings();
        if (settings.value.autoForget) {
          const before = await lib.listChats();
          const gone: string[] = await lib.expireChats({ now: Date.now() });
          if (gone.length) {
            analyticsLibrary.forgotten("expired", gone.length);
            const forgotten = before.filter((chat: SavedChat) =>
              gone.includes(chat.id),
            );
            forgetTabCopies(forgotten);
            if (activeId.value && gone.includes(activeId.value)) clearActive();
            post({ type: "forgotten", ids: gone, wipe: true });
          }
        }
        chats.value = await lib.listChats();
        available.value = true;
      } catch (error) {
        available.value = false;
        console.warn("Saved chats are not available in this browser:", error);
      } finally {
        ready.value = true;
      }
    })();
    return loading;
  }

  // -- which saved chat is this? ---------------------------------------------

  /** The saved chat these messages are, if it's in the list. */
  const idFor = (messages: ChatMessage[] | null | undefined) =>
    messages?.length ? (byKey.value.get(keyOf(messages))?.id ?? null) : null;

  const isPending = (messages: ChatMessage[] | null | undefined) =>
    !!messages?.length && pending.value.includes(keyOf(messages));

  const failureFor = (messages: ChatMessage[] | null | undefined) =>
    messages?.length ? (failures.value[keyOf(messages)] ?? null) : null;

  const chatById = (id: string | null | undefined) =>
    chats.value.find((chat) => chat.id === id) ?? null;

  /**
   * The saved chat these messages are, waiting for a save that is still under
   * way: a page that shows a chat asks before the save has finished.
   */
  async function savedIdFor(messages: ChatMessage[] | null | undefined) {
    if (!messages?.length) return null;
    const key = keyOf(messages);
    const running = saving.get(key);
    if (running) return running;
    await load();
    return byKey.value.get(key)?.id ?? null;
  }

  /**
   * A chat a page shows from memory or from the tab's session: if it is a
   * saved one, make it the tab's active chat, so a reload comes back to it.
   */
  async function adopt(messages: ChatMessage[] | null | undefined) {
    const id = await savedIdFor(messages);
    if (id) setActive(id);
    return id;
  }

  // -- saving ---------------------------------------------------------------

  /** Ask once per tab to keep storage from being evicted, where that is silent. */
  async function persistQuietly() {
    if (persistAsked || isFirefox() || !navigator.storage?.persist) return;
    persistAsked = true;
    try {
      persisted.value =
        (await navigator.storage.persisted()) ||
        (await navigator.storage.persist());
    } catch {
      // Unsupported: the backup file is the safe copy.
    }
  }

  async function save(chat: KeepInput, key: string, source: string) {
    await load();
    try {
      const lib = await library();
      const result = await lib.saveChat(
        {
          messages: chat.messages,
          source: chat.source ?? null,
          title: chat.sourceName ?? chat.source?.name ?? null,
        },
        { now: Date.now() },
      );
      const record = result.chat as SavedChat;
      setActive(record.id);
      available.value = true;
      if (failures.value[key]) {
        const rest = { ...failures.value };
        delete rest[key];
        failures.value = rest;
      }
      await refresh();
      post({ type: "changed" });
      analyticsLibrary.saved(source, {
        isGroup: record.isGroup,
        isNew: result.isNew,
        savedChats: chats.value.length,
      });
      void persistQuietly();
      return record.id;
    } catch (error) {
      const reason = notKeptReason(error);
      failures.value = { ...failures.value, [key]: reason };
      if (reason === "unavailable") available.value = false;
      // The tab shows a chat that isn't saved: a reload must not bring back
      // the one that was active before.
      clearActive();
      analyticsLibrary.notKept(reason, source);
      console.warn("Could not keep the chat on this device:", error);
      return null;
    }
  }

  /**
   * Save a chat on this device, by default, from an upload. Resolves with the
   * saved chat's id, or null when it isn't kept (the sample, or the browser
   * refused). `source` is the analytics name of the upload surface.
   *
   * Registers the save before its first await, so a page that is handed the
   * chat in the same tick can wait for it through savedIdFor.
   */
  function keep(chat: KeepInput, { source }: { source: string }) {
    if (!import.meta.client || chat.sample || !chat.messages?.length) {
      return Promise.resolve(null);
    }
    const key = keyOf(chat.messages);
    const running = saving.get(key);
    if (running) return running;

    const work = save(chat, key, source).finally(() => {
      saving.delete(key);
      pending.value = pending.value.filter((k) => k !== key);
    });
    saving.set(key, work);
    pending.value = [...pending.value, key];
    return work;
  }

  // -- opening --------------------------------------------------------------

  /**
   * Open a saved chat for a page, and make it the tab's active one. `source`
   * says where it was opened from, for analytics.
   */
  async function open(id: string, { source }: { source: string }) {
    await load();
    try {
      const opened = await (await library()).openChat(id, { now: Date.now() });
      await refresh();
      if (!opened) return null;
      setActive(id);
      post({ type: "changed" });
      analyticsLibrary.opened(source, daysSince(opened.previouslyOpenedAt));
      return present(opened);
    } catch (error) {
      console.warn("Could not open the saved chat:", error);
      return null;
    }
  }

  /** The tab's active saved chat, for a page that restores on mount. */
  async function restoreActive(): Promise<OpenedChat | null> {
    await load();
    const id = activeId.value;
    if (!id) return null;
    if (!chats.value.some((chat) => chat.id === id)) {
      clearActive();
      return null;
    }
    try {
      const opened = await (await library()).openChat(id, { now: Date.now() });
      if (!opened) {
        clearActive();
        return null;
      }
      void refresh();
      return present(opened);
    } catch (error) {
      console.warn("Could not reopen the saved chat:", error);
      return null;
    }
  }

  /** An opened chat as the tools hand it to each other (useSharedChat). */
  const toShared = (opened: OpenedChat): SharedChatState => ({
    messages: opened.messages,
    attachments: opened.attachments,
    sourceName: opened.sourceName ?? undefined,
    source: opened.source ?? undefined,
  });

  // -- what a chat remembers -------------------------------------------------

  async function update(id: string, change: Partial<SavedChat>) {
    try {
      const chat = await (await library()).updateChat(id, change);
      if (chat) {
        chats.value = chats.value.map((c) => (c.id === id ? chat : c));
        post({ type: "changed" });
      }
      return chat as SavedChat | null;
    } catch (error) {
      console.warn("Could not update the saved chat:", error);
      return null;
    }
  }

  /** Which participant is the visitor, so the AI never asks twice. */
  const setMe = (id: string, me: string | null) => update(id, { me });

  /** The tool the chat was last used in, as a cleaned-up path ("/tools/inactivity/"). */
  const setLastTool = (id: string, path: string) =>
    update(id, { lastTool: path });

  async function markWrapped(id: string, year: number) {
    const chat = chatById(id);
    if (!chat || chat.wrappedYears?.includes(year)) return;
    await update(id, { wrappedYears: [...(chat.wrappedYears ?? []), year] });
  }

  /** A saved chat's AI readings, newest first, each as it was shown. */
  async function readings(id: string): Promise<SavedReading[]> {
    try {
      const artifacts = await (await library()).listArtifacts(id, READING);
      return artifacts
        .filter((artifact: any) => isAiReport(artifact.data?.report))
        .map((artifact: any) => ({
          id: artifact.id,
          createdAt: artifact.createdAt,
          report: artifact.data.report,
        }));
    } catch (error) {
      console.warn("Could not read the saved readings:", error);
      return [];
    }
  }

  async function addReading(
    id: string,
    report: AiReport,
  ): Promise<SavedReading | null> {
    try {
      const artifact = await (
        await library()
      ).addArtifact(
        id,
        READING,
        { report: plain(report) },
        { now: Date.now() },
      );
      return artifact
        ? {
            id: artifact.id,
            createdAt: artifact.createdAt,
            report: artifact.data.report,
          }
        : null;
    } catch (error) {
      console.warn("Could not keep the reading:", error);
      return null;
    }
  }

  /** The coach conversation that goes with one reading, if the chat is saved. */
  async function coachTurns(
    messages: ChatMessage[],
    summary: string,
  ): Promise<CoachTurnRecord[] | null> {
    const id = await savedIdFor(messages);
    if (!id) return null;
    try {
      const ref = hashText(summary);
      const found = (await (await library()).listArtifacts(id, COACH)).find(
        (artifact: any) => artifact.ref === ref,
      );
      return Array.isArray(found?.data?.turns) ? found.data.turns : null;
    } catch (error) {
      console.warn("Could not read the coach conversation:", error);
      return null;
    }
  }

  async function keepCoachTurns(
    messages: ChatMessage[],
    summary: string,
    turns: CoachTurnRecord[],
  ) {
    const id = await savedIdFor(messages);
    if (!id) return;
    try {
      await (
        await library()
      ).keepArtifact(
        id,
        COACH,
        hashText(summary),
        { turns: plain(turns) },
        { now: Date.now() },
      );
    } catch (error) {
      console.warn("Could not keep the coach conversation:", error);
    }
  }

  // -- forgetting -----------------------------------------------------------

  /**
   * "Don't keep": undo the save of the chat on screen. It stays for the tab,
   * as an unsaved chat always has.
   */
  async function dontKeep(id: string, { source }: { source: string }) {
    try {
      await (await library()).forgetChat(id);
    } catch (error) {
      console.warn("Could not forget the chat:", error);
      return;
    }
    if (activeId.value === id) clearActive();
    await refresh();
    post({ type: "forgotten", ids: [id] });
    analyticsLibrary.notKept("opt_out", source);
  }

  /**
   * Forget a saved chat, here and in every copy the tab keeps of it. Resolves
   * with whether it was the chat open in this tab, which the caller then
   * takes off the screen.
   */
  async function forget(id: string) {
    const chat = chatById(id);
    await (await library()).forgetChat(id);
    const wasOpen = activeId.value === id;
    if (wasOpen) clearActive();
    if (chat) forgetTabCopies([chat]);
    await refresh();
    post({ type: "forgotten", ids: [id], wipe: true });
    analyticsLibrary.forgotten("chat", 1);
    return { wasOpen };
  }

  /** "Forget everything": the database goes, and every tab's copies with it. */
  async function forgetEverything() {
    const count = chats.value.length;
    await (await library()).forgetAll();
    clearActive();
    forgetAllTabCopies();
    chats.value = [];
    settings.value = { autoForget: false };
    post({ type: "cleared" });
    analyticsLibrary.forgotten("all", count);
  }

  async function setAutoForget(on: boolean) {
    settings.value = await (await library()).writeSettings({ autoForget: on });
    post({ type: "changed" });
  }

  // -- keeping it in the browser ---------------------------------------------

  /** What the privacy panel shows about storage. */
  async function storageInfo() {
    const storage = typeof navigator === "undefined" ? null : navigator.storage;
    const estimate = await storage?.estimate?.().catch(() => null);
    persisted.value = (await storage?.persisted?.().catch(() => null)) ?? null;
    return {
      /** Everything the site keeps here, the on-device AI model included. */
      usage: estimate?.usage ?? null,
      quota: estimate?.quota ?? null,
      /** The saved chats alone. */
      chats: chats.value.reduce(
        (sum, chat) => sum + (chat.counts.bytes ?? 0),
        0,
      ),
      persisted: persisted.value,
    };
  }

  /** Ask for persistent storage on an explicit click (Firefox shows a prompt). */
  async function requestPersist() {
    try {
      persisted.value = (await navigator.storage?.persist?.()) ?? null;
    } catch {
      persisted.value = false;
    }
    return persisted.value;
  }

  /** Download every saved chat as one file. */
  async function downloadBackup() {
    const { bytes, count } = await (
      await library()
    ).exportLibrary({
      now: Date.now(),
    });
    const url = URL.createObjectURL(
      new Blob([bytes], { type: "application/gzip" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    analyticsLibrary.backup("download", count);
    return count as number;
  }

  /** Is this dropped file a backup rather than a chat export? */
  const isBackupFile = (file: File | null | undefined) =>
    !!file && (isBackupName(file.name) as boolean);

  /** Put a backup's chats back. Rejects with "not_a_backup" for anything else. */
  async function restoreBackup(file: File) {
    await load();
    const result = await (
      await library()
    ).importLibrary(new Uint8Array(await file.arrayBuffer()), {
      now: Date.now(),
    });
    available.value = true;
    await refresh();
    post({ type: "changed" });
    analyticsLibrary.backup("restore", result.added + result.merged);
    return result as { added: number; merged: number };
  }

  const openPanel = (chatId: string | null = null) => {
    panel.value = { open: true, chatId };
  };
  const closePanel = () => {
    panel.value = { open: false, chatId: null };
  };

  return {
    chats,
    ready,
    available,
    activeId,
    settings,
    persisted,
    panel,
    /** The chat opened last: what the pickers offer first. */
    lastOpened: computed(() => chats.value[0] ?? null),
    load,
    refresh,
    idFor,
    isPending,
    failureFor,
    chatById,
    savedIdFor,
    adopt,
    keep,
    open,
    restoreActive,
    toShared,
    setActive,
    clearActive,
    setMe,
    setLastTool,
    markWrapped,
    readings,
    addReading,
    coachTurns,
    keepCoachTurns,
    dontKeep,
    forget,
    forgetEverything,
    setAutoForget,
    storageInfo,
    requestPersist,
    downloadBackup,
    isBackupFile,
    restoreBackup,
    openPanel,
    closePanel,
  };
}

/**
 * How a saved chat is named and described on screen, in the page's language:
 * its title (or its people, when the export's name says nothing), who is in
 * it, the months it spans and when it was last opened.
 */
export function useSavedChatLabels() {
  const { t, locale } = useI18n();

  const people = (chat: SavedChat, max = 3) => {
    const names = chat.participants.slice(0, max);
    const more = chat.participants.length - names.length;
    if (more > 0) {
      return t("library.peopleMore", { names: names.join(", "), count: more });
    }
    try {
      return new Intl.ListFormat(locale.value, { type: "conjunction" }).format(
        names,
      );
    } catch {
      return names.join(", ");
    }
  };

  const name = (chat: SavedChat) => chat.title || people(chat, 2);

  const range = (chat: SavedChat) => {
    if (!chat.firstDate || !chat.lastDate) return "";
    const format = new Intl.DateTimeFormat(locale.value, {
      month: "short",
      year: "numeric",
    });
    const from = new Date(chat.firstDate);
    const to = new Date(chat.lastDate);
    return typeof format.formatRange === "function"
      ? format.formatRange(from, to)
      : `${format.format(from)} – ${format.format(to)}`;
  };

  const openedAgo = (chat: SavedChat, now = Date.now()) => {
    const days = Math.max(0, Math.floor((now - chat.lastOpenedAt) / DAY));
    const relative = new Intl.RelativeTimeFormat(locale.value, {
      numeric: "auto",
    });
    const time =
      days < 30
        ? relative.format(-days, "day")
        : days < 365
          ? relative.format(-Math.floor(days / 30), "month")
          : relative.format(-Math.floor(days / 365), "year");
    return t("library.openedAgo", { time });
  };

  return { name, people, range, openedAgo };
}
