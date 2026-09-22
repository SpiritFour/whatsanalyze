<template>
  <div
    class="file-handler"
    @dragover.prevent="dragOver"
    @dragleave.prevent="dragLeave"
    @drop.prevent="drop($event)"
  >
    <label
      for="uploadmytextfile"
      class="file-handler__drop"
      :class="{
        'is-dragging': isDragging,
        'is-loading': processing,
        'has-file': isSuccess && !processing && !wrongFile && !isDragging,
      }"
    >
      <input
        id="uploadmytextfile"
        multiple
        type="file"
        accept=".txt, .zip"
        @change="requestUploadFile"
      />

      <!-- Parsing -->
      <div v-if="processing" class="file-handler__state">
        <span class="file-handler__spinner"></span>
        <span class="file-handler__title" v-html="$t('fileProcessing')"></span>
      </div>

      <!-- Dragging over the box -->
      <div v-else-if="isDragging" class="file-handler__state">
        <span class="file-handler__bubble">
          <v-icon size="30" color="#21a68d">mdi-tray-arrow-down</v-icon>
        </span>
        <span class="file-handler__title">{{ $t("fileDrop") }}</span>
      </div>

      <!-- Chat parsed: the box shrinks to a confirmation bar -->
      <div v-else-if="isSuccess && !wrongFile" class="file-handler__loaded">
        <v-icon color="#21a68d">mdi-check-decagram</v-icon>
        <span class="file-handler__loaded-text">
          <span v-html="$t('fileDone')"></span>
          <span class="file-handler__loaded-hint flex gap-1">
            <span v-html="$t('fileSelect')"></span>
            <span v-html="$t('fileAnother')"></span>
          </span>
        </span>
      </div>

      <!-- Idle, or the last file was not a chat export -->
      <div v-else class="file-handler__state">
        <span class="file-handler__bubble">
          <v-icon size="30" color="#21a68d">mdi-tray-arrow-down</v-icon>
        </span>
        <span class="file-handler__title">
          {{ $t("toolDropzone.dropTitle") }}
        </span>
        <span class="file-handler__subtitle">
          {{ $t("toolDropzone.dropSubtitle") }}
        </span>
        <span class="file-handler__button">
          <v-icon size="18">mdi-file-upload-outline</v-icon>
          {{ $t("toolDropzone.selectFile") }}
        </span>
      </div>

      <p
        v-if="wrongFile"
        class="file-handler__error"
        v-html="$t('fileWrong')"
      ></p>
    </label>
  </div>
</template>

<script>
import { analyticsChat } from "~/composables/useAnalytics";
import {
  isZipFile,
  parseChatFile,
  parseSharedFiles,
} from "~/composables/useChatTool";

export default {
  name: "FileHandler",
  data() {
    return {
      isDragging: false,
      wrongFile: false,
      processing: false,
      isSuccess: false,
    };
  },
  methods: {
    /**
     * Parsing happens in composables/useChatTool, which is also what the
     * /tools pages use — one answer to what a WhatsApp export contains,
     * whichever box the file was dropped into.
     */
    async processFileList(fileList, shared = false) {
      const files = Array.from(fileList || []);
      const wasDragged = this.isDragging;

      this.isDragging = false;
      this.processing = true;
      this.isSuccess = false;
      this.wrongFile = false;

      if (!files.length) return this.showErrorMessage("_undefined_shared_file");

      const multiple = shared || files.length > 1;
      if (!multiple) {
        analyticsChat.uploadStarted(
          isZipFile(files[0]) ? "zip" : "txt",
          wasDragged ? "drop" : "picker",
        );
      }

      try {
        const chatObject = multiple
          ? await parseSharedFiles(files)
          : await parseChatFile(files[0]);
        this.updateMessages(chatObject);
      } catch (error) {
        console.error("Chat parsing failed", error);
        this.showErrorMessage(error?.message);
      }
    },

    updateMessages(chatObject) {
      this.$emit("new_messages", chatObject);
      this.$emit("hide_explanation", true);
      this.processing = false;
      this.isSuccess = true;
      analyticsChat.parsedSuccess(
        chatObject.messages?.length || 0,
        // Participants, counted off the parsed messages. The transformed chat
        // knows this too, but it does not exist yet at this point.
        new Set(chatObject.messages?.map((message) => message.author)).size,
        chatObject.durationMs,
      );
    },

    showErrorMessage(text = undefined) {
      this.wrongFile = true;
      this.processing = false;
      this.isSuccess = false;
      const errorCode = text ? String(text).replace(/\s+/g, "_") : "unknown";
      analyticsChat.parsedError(errorCode);
    },

    dragOver() {
      this.isDragging = true;
    },

    dragLeave() {
      this.isDragging = false;
    },

    drop(e) {
      this.processFileList(e.dataTransfer.files);
    },

    requestUploadFile() {
      this.processFileList(this.$el.querySelector("#uploadmytextfile").files);
    },
  },
};
</script>

<style lang="scss" scoped>
// Same card as components/tools/ToolDropzone.vue — the upload box is the first
// thing every visitor touches, so it looks identical on the homepage, the PWA
// share target and the tool pages.
.file-handler {
  width: 100%;
}

.file-handler__drop {
  position: relative;
  display: block;
  cursor: pointer;
  background: $wa-surface-white;
  color: $wa-ink;
  border: 2px dashed $wa-border;
  border-radius: $wa-radius-xl;
  padding: clamp(0.8rem, 3vw, 2rem) clamp(1rem, 2vw, 1.5rem);
  text-align: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: $wa-shadow-lg;

  &:hover {
    border-color: $wa-accent;
  }

  &.is-dragging {
    border-color: $wa-accent;
    background: #f0fdf4;
    transform: scale(1.01);
  }

  &.has-file {
    padding: 1.1rem 1.5rem;
    border-style: solid;
    border-color: #bbf7d0;
    background: #f0fdf4;
  }
}

input[type="file"] {
  display: none;
}

.file-handler__state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-handler__bubble {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: $wa-accent-soft;
  border: 1px solid rgba(33, 166, 141, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.file-handler__title {
  font-size: clamp(1.15rem, 2.5vw, 1.35rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.3;
}

.file-handler__subtitle {
  margin-top: 0.5rem;
  font-size: 0.95rem;
  color: $wa-ink-muted;
}

.file-handler__button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1.8rem;
  padding: 0.8em 1.8em;
  border-radius: $wa-radius-pill;
  background: $wa-accent;
  color: $wa-surface-white;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: $wa-shadow-accent;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.file-handler__drop:hover .file-handler__button {
  background: $wa-accent-light;
  transform: translateY(-1px);
}

.file-handler__loaded {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: left;
}

.file-handler__loaded-text {
  display: flex;
  flex-direction: column;
  font-size: 0.96rem;
  font-weight: 700;
}

.file-handler__loaded-hint {
  font-size: 0.8rem;
  font-weight: 500;
  color: $wa-ink-muted;

  :deep(strong) {
    font-weight: 600;
  }
}

.file-handler__spinner {
  width: 44px;
  height: 44px;
  margin-bottom: 1rem;
  border: 3px solid $wa-accent-soft;
  border-top-color: $wa-accent;
  border-radius: 50%;
  animation: file-handler-spin 0.8s linear infinite;
}

@keyframes file-handler-spin {
  to {
    transform: rotate(360deg);
  }
}

.file-handler__error {
  margin: 1rem 0 0;
  padding: 0.6rem 0.9rem;
  border-radius: $wa-radius-sm;
  font-size: 0.9rem;
  color: #dd2c00;
  background: rgba(221, 44, 0, 0.08);
  border: 1px solid rgba(221, 44, 0, 0.2);
}
</style>
