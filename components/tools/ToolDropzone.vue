<template>
  <div class="tool-dropzone-wrapper">
    <!-- Technical Security Banner (Peak Design Style) -->
    <div class="tech-spec-bar">
      <span class="pulse-dot"></span>
      <span class="mono-label">LOCAL CLIENT-SIDE ENGINE</span>
      <span class="separator">•</span>
      <span class="mono-label">ZERO CLOUD TRANSMISSION</span>
      <span class="separator">•</span>
      <span class="mono-label">END-TO-END PRIVATE</span>
    </div>

    <!-- Drop Container -->
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

        <h3 class="dropzone-title">Drop your WhatsApp chat export here</h3>
        <p class="dropzone-subtitle">
          Accepts exported <code>.txt</code> or <code>.zip</code> chat files
        </p>

        <div class="action-buttons" @click.stop>
          <button type="button" class="btn-primary" @click="triggerFileDialog">
            <v-icon size="18" class="mr-1">mdi-file-upload-outline</v-icon>
            Select Chat File
          </button>
          <button type="button" class="btn-ghost" @click="loadSampleChat">
            <v-icon size="18" class="mr-1">mdi-play-circle-outline</v-icon>
            Try With Sample Chat
          </button>
        </div>
      </div>

      <!-- Loading / Parsing State -->
      <div v-else-if="loading" class="dropzone-content loading-state">
        <div class="spinner-ring"></div>
        <h4 class="loading-title">Analyzing Conversation Gaps...</h4>
        <p class="loading-meta mono-label">
          Computing timestamps, response latencies, and participant inactivity
        </p>
      </div>

      <!-- Parsed Success State / Change File Bar -->
      <div v-else class="loaded-file-bar">
        <div class="file-summary">
          <v-icon color="#00e676" class="mr-2">mdi-check-decagram</v-icon>
          <div class="file-info">
            <span class="file-name">{{ loadedFileName }}</span>
            <span class="file-meta mono-label">
              {{ parsedMessageCount.toLocaleString() }} messages • analyzed in
              {{ parseDurationMs }}ms
            </span>
          </div>
        </div>

        <button
          type="button"
          class="btn-change-file"
          @click="triggerFileDialog"
        >
          <v-icon size="16" class="mr-1">mdi-swap-horizontal</v-icon>
          Switch File
        </button>
      </div>

      <!-- Error message if parsing fails -->
      <div v-if="errorMessage" class="dropzone-error" @click.stop>
        <v-icon color="#ff5252" size="18" class="mr-1"
          >mdi-alert-circle-outline</v-icon
        >
        <span>{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  parseChatFile,
  analyzeInactivity,
  useSharedChat,
  type ChatMessage,
  type ChatAttachment,
  type ChatInactivityAnalysis,
} from "~/composables/useChatTool";

const emit = defineEmits<{
  (e: "analyzed", payload: {
    analysis: ChatInactivityAnalysis;
    messages: ChatMessage[];
    attachments: ChatAttachment[];
  }): void;
  (e: "reset"): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const loading = ref(false);
const hasLoadedFile = ref(false);
const loadedFileName = ref("");
const parsedMessageCount = ref(0);
const parseDurationMs = ref(0);
const errorMessage = ref<string | null>(null);

const sharedChat = useSharedChat();

function triggerFileDialog() {
  errorMessage.value = null;
  fileInput.value?.click();
}

function onDragOver() {
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

async function processInput(fileOrText: File | string, fileName = "WhatsApp Chat") {
  loading.value = true;
  errorMessage.value = null;

  try {
    const { messages, attachments, durationMs } = await parseChatFile(fileOrText);

    if (!messages || messages.length === 0) {
      throw new Error("No messages found. Please ensure this is a valid WhatsApp chat export (.txt or .zip).");
    }

    const analysis = analyzeInactivity(messages, durationMs);
    if (!analysis) {
      throw new Error("Could not compute inactivity metrics: Chat contains no participant messages.");
    }

    hasLoadedFile.value = true;
    loadedFileName.value = fileName;
    parsedMessageCount.value = messages.length;
    parseDurationMs.value = durationMs;

    // Cache in shared state for seamless transition to full analysis
    sharedChat.value = {
      messages,
      attachments,
      sourceName: fileName,
    };

    emit("analyzed", {
      analysis,
      messages,
      attachments,
    });
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "Failed to parse WhatsApp chat export.";
  } finally {
    loading.value = false;
    isDragging.value = false;
  }
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  await processInput(file, file.name);
}

async function onDrop(event: DragEvent) {
  isDragging.value = false;
  if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
  const file = event.dataTransfer.files[0];
  await processInput(file, file.name);
}

async function loadSampleChat() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const response = await fetch("/chat_example.txt");
    if (!response.ok) {
      throw new Error("Failed to load sample chat file.");
    }
    const text = await response.text();
    await processInput(text, "Sample WhatsApp Chat (Jane & John)");
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "Failed to load sample chat.";
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.tool-dropzone-wrapper {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
}

.tech-spec-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: #718096;
  text-transform: uppercase;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #00e676;
  box-shadow: 0 0 8px #00e676;
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
  color: #4a5568;
}

.tool-dropzone {
  position: relative;
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  padding: 40px 24px;
  text-align: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #21a68d;
    background: #fcfdfd;
  }

  &.is-dragging {
    border-color: #21a68d;
    background: #f0fdf4;
    transform: scale(1.01);
  }

  &.has-file {
    padding: 16px 24px;
    border-style: solid;
    border-color: #bbf7d0;
    background: #f0fdf4;
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
    margin-bottom: 16px;
  }

  .dropzone-title {
    color: #0f172a;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }

  .dropzone-subtitle {
    color: #475569;
    font-size: 0.92rem;
    margin-bottom: 24px;

    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 0.82rem;
      color: #0f766e;
      border: 1px solid #e2e8f0;
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
    background: #21a68d;
    color: #ffffff;
    font-size: 0.92rem;
    font-weight: 600;
    padding: 10px 22px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #2ab89c;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(33, 166, 141, 0.4);
    }
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    background: #f8fafc;
    color: #334155;
    font-size: 0.92rem;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #e2e8f0;
      color: #0f172a;
      border-color: #94a3b8;
    }
    border-color: rgba(255, 255, 255, 0.25);
  }
}

.spinner-ring {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(33, 166, 141, 0.2);
  border-top-color: #21a68d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.loading-title {
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.loading-meta {
  color: #64748b;
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
  color: #0f172a;
  font-weight: 700;
  font-size: 0.96rem;
}

.file-meta {
  color: #059669;
  font-size: 0.76rem;
  font-weight: 600;
}

.btn-change-file {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
}

.dropzone-error {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: #ff5252;
  background: rgba(255, 82, 82, 0.1);
  border: 1px solid rgba(255, 82, 82, 0.25);
  border-radius: 8px;
  padding: 8px 14px;
}
</style>
