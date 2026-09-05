<template>
  <div class="tool-dropzone-wrapper">
    <!-- Technical Security Banner -->
    <div class="tech-spec-bar">
      <span class="pulse-dot"></span>
      <span class="mono-label">LOCAL CLIENT ENGINE</span>
      <span class="separator">•</span>
      <span class="mono-label">ZERO CLOUD TRANSMISSION</span>
      <span class="separator">•</span>
      <span class="mono-label">100% PRIVATE</span>
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
          <v-icon color="#21a68d" class="mr-2">mdi-check-decagram</v-icon>
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
        <v-icon color="#dd2c00" size="18" class="mr-1"
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
  useSharedChat,
  type ChatMessage,
  type ChatAttachment,
  type ChatInactivityAnalysis,
} from "~/composables/useChatTool";
import { analyzeInactivity } from "~/utils/inactivity";

const emit = defineEmits<{
  (
    e: "analyzed",
    payload: {
      analysis: ChatInactivityAnalysis;
      messages: ChatMessage[];
      attachments: ChatAttachment[];
    }
  ): void;
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

async function processInput(
  fileOrText: File | string,
  fileName = "WhatsApp Chat"
) {
  loading.value = true;
  errorMessage.value = null;

  try {
    const { messages, attachments, durationMs } = await parseChatFile(
      fileOrText
    );

    if (!messages || messages.length === 0) {
      throw new Error(
        "No messages found. Please ensure this is a valid WhatsApp chat export (.txt or .zip)."
      );
    }

    const analysis = analyzeInactivity(messages, durationMs);
    if (!analysis) {
      throw new Error(
        "Could not compute inactivity metrics: Chat contains no participant messages."
      );
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
    errorMessage.value =
      err instanceof Error
        ? err.message
        : "Failed to parse WhatsApp chat export.";
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
  if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0)
    return;
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
    errorMessage.value =
      err instanceof Error ? err.message : "Failed to load sample chat.";
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
  color: rgba(245, 245, 247, 0.65);
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
  color: rgba(245, 245, 247, 0.35);
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
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);

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
