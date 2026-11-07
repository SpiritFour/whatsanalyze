<template>
  <div class="tool-dropzone-wrapper">
    <!-- Technical Security Banner. The AI pages offer a cloud reading, so
         "zero cloud transmission" would be untrue there: they say what the
         cloud gets instead. -->
    <div class="tech-spec-bar">
      <span class="pulse-dot"></span>
      <span class="mono-label">{{ t("toolDropzone.localEngine") }}</span>
      <span class="separator">•</span>
      <span class="mono-label">{{
        t(toolType === "ai" ? "toolDropzone.aiCloud" : "toolDropzone.zeroCloud")
      }}</span>
      <span class="separator">•</span>
      <span class="mono-label">{{
        t(
          toolType === "ai"
            ? "toolDropzone.aiTraining"
            : "toolDropzone.private",
        )
      }}</span>
    </div>

    <!-- Drop Container Card (Styled like LandingDocMock / LandingStatsMock) -->
    <div
      class="tool-dropzone"
      :class="{
        'is-dragging': isDragging,
        'is-loading': loading,
        'has-file': hasLoadedFile,
      }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".txt,.zip"
        class="hidden-file-input"
        @change="onFileSelected"
      />

      <!-- Idle / Waiting State -->
      <div
        v-if="!loading && !hasLoadedFile"
        class="dropzone-content"
        @click="triggerFileDialog"
      >
        <div class="icon-bubble">
          <v-icon size="32" color="#21a68d">mdi-tray-arrow-down</v-icon>
        </div>

        <h3 class="dropzone-title">{{ t("toolDropzone.dropTitle") }}</h3>
        <p class="dropzone-subtitle">{{ t("toolDropzone.dropSubtitle") }}</p>

        <div class="action-buttons" @click.stop>
          <button type="button" class="btn-primary" @click="triggerFileDialog">
            <v-icon size="18" class="mr-1">mdi-file-upload-outline</v-icon>
            {{ t("toolDropzone.selectFile") }}
          </button>
          <button type="button" class="btn-ghost" @click="loadSampleChat">
            <v-icon size="18" class="mr-1">mdi-play-circle-outline</v-icon>
            {{ t("toolDropzone.trySample") }}
          </button>
        </div>

        <LibraryPicker @open="openSaved" />
      </div>

      <!-- Loading / Parsing State -->
      <div v-else-if="loading" class="dropzone-content loading-state">
        <div class="spinner-ring"></div>
        <h4 class="loading-title">{{ t("toolDropzone.analyzingTitle") }}</h4>
        <p class="loading-meta mono-label">
          {{ t("toolDropzone.analyzingSubtitle") }}
        </p>
      </div>

      <!-- Parsed Success State / Change File Bar -->
      <div v-else class="loaded-file-bar">
        <div class="file-summary">
          <v-icon color="#21a68d" class="mr-2">mdi-check-decagram</v-icon>
          <div class="file-info">
            <span class="file-name">{{ loadedFileName }}</span>
            <span class="file-meta mono-label">
              <!-- a restored chat was not parsed now, so it has no time -->
              {{
                parseDurationMs
                  ? t("toolDropzone.messagesAnalyzedIn", {
                      count: parsedMessageCount.toLocaleString(),
                      time: parseDurationMs,
                    })
                  : t("toolDropzone.messagesRestored", {
                      count: parsedMessageCount.toLocaleString(),
                    })
              }}
            </span>
          </div>
        </div>

        <button
          type="button"
          class="btn-change-file"
          @click="triggerFileDialog"
        >
          <v-icon size="16" class="mr-1">mdi-swap-horizontal</v-icon>
          {{ t("toolDropzone.switchFile") }}
        </button>
      </div>
      <LibraryPicker
        v-if="hasLoadedFile && !loading"
        :exclude="library.idFor(shownChat?.messages)"
        @open="openSaved"
      />

      <!-- Error message if parsing fails -->
      <div v-if="errorMessage" class="dropzone-error" @click.stop>
        <v-icon color="#dd2c00" size="18" class="mr-1"
          >mdi-alert-circle-outline</v-icon
        >
        <span>{{ errorMessage }}</span>
      </div>
      <p v-if="notice" class="dropzone-notice" role="status">{{ notice }}</p>
    </div>

    <LibraryStatus
      v-if="hasLoadedFile && shownChat"
      :messages="shownChat.messages"
      :source="shownChat.source"
      :source-name="shownChat.sourceName"
      :sample="shownChat.sample"
      :surface="surface"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from "vue";
import { analyticsTools } from "~/composables/useAnalytics";

const { t } = useI18n();
import {
  clearChatSession,
  loadChatSession,
  saveChatSession,
} from "~/utils/chatSession";
import { clearUpload, loadUpload, saveUpload } from "~/utils/uploadStore";
import {
  parseChatFile,
  useSharedChat,
  type ParsedChat,
  type ChatMessage,
  type ChatAttachment,
  type ChatSource,
} from "~/composables/useChatTool";
import { participantMessages } from "~/utils/utils";
import { SAMPLE_CHAT_NAME, SAMPLE_CHAT_URL } from "~/utils/ai/sample";
import { cleanPath } from "~/utils/cleanPath";
import { useLibrary, type OpenedChat } from "~/composables/useLibrary";
import { analyzeInactivity } from "~/utils/inactivity";
import { analyzeMessages } from "~/utils/messageCounter";
import { analyzeWords } from "~/utils/wordCounter";
import { analyzeHeatmap } from "~/utils/chatHeatmap";
interface Props {
  toolType?:
    | "inactivity"
    | "messages"
    | "words"
    | "heatmap"
    | "ai"
    | "court"
    | "export_guide"
    | "pdf";
}

const props = withDefaults(defineProps<Props>(), {
  toolType: "inactivity",
});

// `e` and `payload` below name the parameters of a TypeScript call signature.
// They are types, not variables, and only the TypeScript-aware no-unused-vars
// knows the difference — this project still lints with the base rule, which
// reported all three as unused and failed the pre-commit hook.
/* eslint-disable no-unused-vars */
const emit = defineEmits<{
  (
    e: "analyzed",
    payload: {
      analysis: unknown;
      messages: ChatMessage[];
      attachments: ChatAttachment[];
      source?: ChatSource;
      /** The sample chat, whose AI readings were made in advance. */
      sample?: boolean;
    },
  ): void;
  (e: "reset"): void;
}>();
/* eslint-enable no-unused-vars */

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const loading = ref(false);
const hasLoadedFile = ref(false);
const loadedFileName = ref("");
const parsedMessageCount = ref(0);
const parseDurationMs = ref(0);
const errorMessage = ref<string | null>(null);
/** A line about something other than a chat: a restored backup. */
const notice = ref<string | null>(null);
/** The chat on screen, for the saved-chat line under the box. */
const shownChat = shallowRef<{
  messages: ChatMessage[];
  source?: ChatSource;
  sourceName: string;
  sample: boolean;
} | null>(null);

const sharedChat = useSharedChat();
const library = useLibrary();
// This tool, as a saved chat remembers it ("/tools/inactivity/").
const toolPath = cleanPath(useRoute().path);
const surface = `tool_${props.toolType}`;

/** A saved chat on screen here: remember this tool as the last one used. */
function noteShown(messages: ChatMessage[]) {
  void library.adopt(messages).then((id) => {
    if (id) void library.setLastTool(id, toolPath);
  });
}

function triggerFileDialog() {
  errorMessage.value = null;
  fileInput.value?.click();
}
// For the page: the AI page's "your turn" after the sample's reading, and
// its ?try=sample from a reading someone sent.
defineExpose({
  chooseFile: triggerFileDialog,
  loadSample: () => loadSampleChat(),
});

function onDragOver() {
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

async function processInput(
  fileOrText: File | string,
  fileName = "WhatsApp Chat",
  // false when re-reading the export kept for this tab, which is no new upload
  track = true,
  sample = false,
) {
  loading.value = true;
  errorMessage.value = null;
  notice.value = null;

  try {
    const parsed = await parseChatFile(fileOrText);
    showChat(parsed, fileName, {
      sample,
      // Saved on this device by default, the sample never. Started before
      // the page is handed the chat, so a page asking whether it's saved
      // (the AI page, for its readings) waits for the answer.
      beforeShow: () => {
        if (sample) {
          // It replaces whatever this tab had open.
          library.clearActive();
          return;
        }
        void library
          .keep({ ...parsed, sourceName: fileName }, { source: surface })
          .then((id) => {
            if (id) void library.setLastTool(id, toolPath);
          });
      },
    });
    // Kept for the tab, like the home page does: a full page load (the
    // round trip through Stripe Checkout, a reload) used to lose the chat on
    // every /tools page while the analyzer still had it.
    // The sample keeps its name across a reload; a real export's file name
    // (often the other person's) stays out of storage.
    saveChatSession(
      sample ? { ...parsed, sample, sourceName: fileName } : parsed,
    );
    // The court PDF hashes every attachment, so its pages keep the export
    // itself too; the sample chat replaces whatever was kept.
    if (props.toolType === "court") {
      void (typeof fileOrText === "string"
        ? clearUpload()
        : saveUpload(fileOrText));
    }
    if (!track) return;
    analyticsTools.analyzed(
      props.toolType,
      parsedMessageCount.value,
      parseDurationMs.value,
    );
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to parse WhatsApp chat export.";
    errorMessage.value = msg;
    analyticsTools.error(props.toolType, msg);
  } finally {
    loading.value = false;
    isDragging.value = false;
  }
}

/** Analyze a parsed chat for this tool and hand it to the page. */
function showChat(
  { messages, attachments, durationMs, source }: ParsedChat,
  fileName: string,
  {
    sample = false,
    beforeShow,
  }: { sample?: boolean; beforeShow?: () => void } = {},
) {
  if (!messages || messages.length === 0) {
    throw new Error(
      "No messages found. Please ensure this is a valid WhatsApp chat export (.txt or .zip).",
    );
  }

  let analysis: unknown;
  if (
    props.toolType === "ai" ||
    props.toolType === "court" ||
    props.toolType === "export_guide" ||
    props.toolType === "pdf"
  ) {
    // These pages analyze on demand: the AI once the visitor has picked
    // where, the court PDF once it is downloaded. The export guide and the
    // PDF page only hand the chat on to the page that does the work.
    analysis = { messages };
  } else if (props.toolType === "messages") {
    analysis = analyzeMessages(messages, durationMs);
  } else if (props.toolType === "words") {
    analysis = analyzeWords(messages, durationMs);
  } else if (props.toolType === "heatmap") {
    analysis = analyzeHeatmap(messages, durationMs);
  } else {
    analysis = analyzeInactivity(messages, durationMs);
  }

  if (!analysis) {
    throw new Error(
      "Could not compute metrics: Chat contains no participant messages.",
    );
  }
  beforeShow?.();
  hasLoadedFile.value = true;
  loadedFileName.value = fileName;
  // What the report below counts, not the raw line count: WhatsApp's own
  // notices are in `messages` but are nobody's message.
  parsedMessageCount.value = participantMessages(messages).length;
  parseDurationMs.value = durationMs;
  shownChat.value = { messages, source, sourceName: fileName, sample };

  // Cache in shared state for seamless transition to full analysis
  sharedChat.value = {
    messages,
    attachments,
    sourceName: fileName,
    source,
    ...(sample ? { sample } : {}),
  };

  emit("analyzed", {
    analysis,
    messages,
    attachments,
    source,
    ...(sample ? { sample } : {}),
  });
}

// The page is prerendered, so this input accepts a file before Vue hydrates
// it and that change event reaches no handler. Pick up whatever is already
// selected once there is one.
onMounted(async () => {
  if (fileInput.value?.files?.length) {
    void handleFile(fileInput.value.files[0]);
    return;
  }
  // The chat this visitor already has open, so they don't have to upload it
  // again: handed over in memory by another page in this visit, then the
  // tab's saved chat, then the copy kept for the tab (a chat that isn't
  // saved, or one from before a full page load where storage is refused).
  const restored: {
    messages: ChatMessage[];
    attachments?: unknown[];
    source?: ChatSource | null;
    sourceName?: string | null;
    sample?: boolean;
    chat?: OpenedChat["chat"];
  } | null = sharedChat.value?.messages?.length
    ? sharedChat.value
    : ((await library.restoreActive()) ?? loadChatSession());

  // After a full page load the restored chat has the messages but not the
  // media. The export kept for this tab has both, if it is that chat's
  // export (not one since uploaded somewhere else).
  if (props.toolType === "court" && restored !== sharedChat.value) {
    const kept = await loadUpload();
    const sources = restored?.chat?.sources ?? [restored?.source];
    if (
      kept &&
      (!restored ||
        sources.some(
          (source) =>
            !source || (source.name === kept.name && source.size === kept.size),
        ))
    ) {
      await processInput(kept, kept.name, false);
      return;
    }
  }

  if (!restored?.messages?.length) return;
  try {
    showChat(
      {
        messages: restored.messages,
        attachments: (restored.attachments ?? []) as ChatAttachment[],
        durationMs: 0,
        source: restored.source ?? undefined,
      },
      restored.sourceName ?? restored.source?.name ?? "WhatsApp Chat",
      { sample: !!restored.sample },
    );
    if (!restored.sample) noteShown(restored.messages);
  } catch (err) {
    console.warn("Could not restore the previous chat:", err);
    clearChatSession();
  }
});

/** A saved chat picked in "Use a saved chat". */
async function openSaved(id: string) {
  errorMessage.value = null;
  notice.value = null;
  const opened = await library.open(id, { source: "picker" });
  if (!opened) return;
  try {
    showChat(
      {
        messages: opened.messages,
        attachments: opened.attachments,
        durationMs: 0,
        source: opened.source ?? undefined,
      },
      opened.sourceName ?? opened.chat.title ?? "WhatsApp Chat",
    );
    saveChatSession(opened);
    void library.setLastTool(id, toolPath);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err);
  }
}

/** A backup of the saved chats, dropped on the box. */
async function restoreBackup(file: File) {
  errorMessage.value = null;
  try {
    const { added, merged } = await library.restoreBackup(file);
    notice.value = t("library.backupRestored", { count: added + merged });
  } catch (err) {
    console.warn("Could not restore the backup:", err);
    notice.value = t("library.backupInvalid");
  }
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  await handleFile(target.files[0]);
}

async function handleFile(file: File) {
  const fileType = file.name.endsWith(".zip") ? "zip" : "txt";
  analyticsTools.fileUploaded(props.toolType, fileType, "picker");
  await processInput(file, file.name);
}

async function onDrop(event: DragEvent) {
  isDragging.value = false;
  if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0)
    return;
  const file = event.dataTransfer.files[0];
  if (library.isBackupFile(file)) return restoreBackup(file);
  const fileType = file.name.endsWith(".zip") ? "zip" : "txt";
  analyticsTools.fileUploaded(props.toolType, fileType, "drop");
  await processInput(file, file.name);
}
async function loadSampleChat() {
  loading.value = true;
  errorMessage.value = null;
  analyticsTools.sampleLoaded(props.toolType);
  try {
    const response = await fetch(SAMPLE_CHAT_URL);
    if (!response.ok) {
      throw new Error(`sample_http_${response.status}`);
    }
    const text = await response.text();
    await processInput(text, SAMPLE_CHAT_NAME, true, true);
  } catch (err) {
    // The browser's own words for a request that failed ("Load failed",
    // "Failed to fetch") tell a visitor nothing; say what happened instead.
    errorMessage.value = t("toolDropzone.sampleFailed");
    analyticsTools.error(
      props.toolType,
      err instanceof Error ? err.message : "sample_failed",
    );
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.tool-dropzone-wrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.tech-spec-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  // the section's own text colour, so it reads on the dark hero and on a
  // white section alike
  color: inherit;
  opacity: 0.65;
  text-transform: uppercase;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #21a68d;
  box-shadow: 0 0 8px #21a68d;
  animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

.separator {
  opacity: 0.55;
}

.tool-dropzone {
  position: relative;
  background: #ffffff;
  color: #1d1d1f;
  border: 2px dashed rgba(29, 29, 31, 0.16);
  border-radius: 20px;
  padding: clamp(2rem, 5vw, 3rem) clamp(1.2rem, 3vw, 2rem);
  text-align: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);

  &:hover {
    border-color: #21a68d;
    background: #ffffff;
  }

  &.is-dragging {
    border-color: #21a68d;
    background: #f0fdf4;
    transform: scale(1.01);
  }

  &.has-file {
    padding: 18px 24px;
    border-style: solid;
    border-color: #bbf7d0;
    background: #f0fdf4;
  }
}

.hidden-file-input {
  display: none;
}

.dropzone-content {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-bubble {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(33, 166, 141, 0.12);
  border: 1px solid rgba(33, 166, 141, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.dropzone-title {
  color: #1d1d1f;
  font-size: clamp(1.15rem, 2.5vw, 1.35rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  margin-bottom: 0.5rem;
}

.dropzone-subtitle {
  color: rgba(29, 29, 31, 0.68);
  font-size: 0.95rem;
  margin-bottom: 1.8rem;

  code {
    background: #f5f5f7;
    padding: 2px 6px;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 0.82rem;
    color: #0f766e;
    border: 1px solid rgba(29, 29, 31, 0.1);
  }
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #21a68d;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.8em 1.8em;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(33, 166, 141, 0.35);
  transition: all 0.2s ease;

  &:hover {
    background: #2ab89c;
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(33, 166, 141, 0.45);
  }
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.8em 1.6em;
  border-radius: 999px;
  border: 1px solid rgba(29, 29, 31, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e5ea;
    color: #1d1d1f;
    border-color: rgba(29, 29, 31, 0.2);
  }
}

.spinner-ring {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(33, 166, 141, 0.2);
  border-top-color: #21a68d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-title {
  color: #1d1d1f;
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.loading-meta {
  color: rgba(29, 29, 31, 0.6);
  font-size: 0.78rem;
}

.loaded-file-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.file-summary {
  display: flex;
  align-items: center;
  text-align: left;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  color: #1d1d1f;
  font-weight: 700;
  font-size: 0.96rem;
}

.file-meta {
  color: #0f766e;
  font-size: 0.76rem;
  font-weight: 600;
}

.btn-change-file {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  color: #1d1d1f;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(29, 29, 31, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f7;
    color: #1d1d1f;
  }
}

.dropzone-notice {
  margin-top: 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f766e;
}

.dropzone-error {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: #dd2c00;
  background: rgba(221, 44, 0, 0.08);
  border: 1px solid rgba(221, 44, 0, 0.2);
  border-radius: 10px;
  padding: 8px 14px;
}
</style>
