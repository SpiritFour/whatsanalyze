<template>
  <!-- WhatsApp to PDF: upload, pick a look, see it, print or download it.
       The preview, the browser printout and the PDF are one piece of HTML
       (utils/pdf/chatView.ts), so they cannot drift apart. -->
  <LandingSection theme="white" :title="title" :text="text">
    <OneTimePurchaseReturn :chat="chat" :checkout-source="checkoutSource" />
    <div id="dropzone-slot">
      <ToolDropzone
        tool-type="pdf"
        @analyzed="onChatAnalyzed"
        @reset="chat = null"
      />
    </div>

    <div v-if="chat" id="chat-pdf-tool" class="chat-pdf">
      <p v-if="mediaNotLoaded" class="chat-pdf__note">
        {{ t("pdfTool.mediaNotLoaded") }}
      </p>

      <div class="chat-pdf__layout">
        <form class="chat-pdf__controls" @submit.prevent>
          <fieldset class="chat-pdf__group">
            <legend>{{ t("pdfTool.styleTitle") }}</legend>
            <div class="chat-pdf__styles">
              <label
                v-for="style in styles"
                :key="style.id"
                class="style-option"
                :class="{ 'is-selected': options.style === style.id }"
              >
                <input
                  v-model="options.style"
                  type="radio"
                  name="chat-style"
                  :value="style.id"
                  class="visually-hidden"
                  :data-style="style.id"
                />
                <span
                  class="style-option__swatch"
                  :style="{ background: style.page }"
                  aria-hidden="true"
                >
                  <span
                    class="style-option__bubble"
                    :style="{
                      background: style.bubbleIn,
                      borderRadius: style.radius / 2 + 'px',
                    }"
                  />
                  <span
                    class="style-option__bubble is-out"
                    :style="{
                      background: style.bubbleOut,
                      borderRadius: style.radius / 2 + 'px',
                    }"
                  />
                </span>
                <span class="style-option__label">
                  {{ t(`pdfTool.style.${style.id.replace("-", "_")}`) }}
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset class="chat-pdf__group">
            <legend>{{ t("pdfTool.adjustTitle") }}</legend>

            <label class="chat-pdf__field">
              <span>{{ t("pdfTool.me") }}</span>
              <select v-model="options.me" name="chat-me">
                <option v-for="name in participants" :key="name" :value="name">
                  {{ name }}
                </option>
              </select>
            </label>

            <div class="chat-pdf__field" role="radiogroup">
              <span id="chat-pdf-size">{{ t("pdfTool.textSize") }}</span>
              <div class="segmented" aria-labelledby="chat-pdf-size">
                <label
                  v-for="size in ['s', 'm', 'l']"
                  :key="size"
                  :class="{ 'is-selected': options.textSize === size }"
                >
                  <input
                    v-model="options.textSize"
                    type="radio"
                    name="chat-text-size"
                    :value="size"
                    class="visually-hidden"
                  />
                  {{ t(`pdfTool.size.${size}`) }}
                </label>
              </div>
            </div>

            <label class="chat-pdf__check">
              <input v-model="options.showTimes" type="checkbox" />
              {{ t("pdfTool.showTimes") }}
            </label>
            <label class="chat-pdf__check">
              <input v-model="options.showMedia" type="checkbox" />
              {{ t("pdfTool.showMedia") }}
            </label>
            <label class="chat-pdf__check">
              <input v-model="options.showNames" type="checkbox" />
              {{ t("pdfTool.showNames") }}
            </label>
          </fieldset>

          <div class="chat-pdf__actions">
            <button
              type="button"
              class="chat-pdf__print"
              :disabled="printing"
              @click="printChat"
            >
              {{ t("pdfTool.print") }}
            </button>
            <p class="chat-pdf__hint">
              {{
                hasFullAccess
                  ? t("pdfTool.printHintFull")
                  : t("pdfTool.printHint")
              }}
            </p>
          </div>
        </form>

        <div class="chat-pdf__preview">
          <p class="chat-pdf__preview-label">
            {{ t("pdfTool.previewLabel", { count: previewCount }) }}
          </p>
          <ChatPreview :html="previewHtml" :css="previewCss" />
        </div>
      </div>

      <!-- #payButton: where PdfDownloadPopup scrolls a returning buyer -->
      <div id="payButton" class="chat-pdf__download">
        <PdfDownloadPopup
          :chat="chat"
          :attachments="attachments"
          :ego="options.me"
          :source="source"
          :is-valid-subscription="isSubscriptionValid"
          :chat-view="chatView"
        />
      </div>
    </div>
  </LandingSection>
</template>

<script setup>
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  shallowRef,
  toRaw,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import ChatPreview from "~/components/tools/ChatPreview.vue";
import PdfDownloadPopup from "~/components/ChatVisualization/PdfDownloadPopup.vue";
import OneTimePurchaseReturn from "~/components/ChatVisualization/OneTimePurchaseReturn.vue";
import { Chat } from "~/utils/transformChatData";
import { useSubscriptionStore } from "~/stores/subscription";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { scrollToSettled } from "~/utils/scroll";
import {
  CHAT_STYLES,
  CHAT_STYLE_IDS,
  normalizeChatViewOptions,
} from "~/utils/pdf/chatStyles";
import {
  chatPrintGlobalCss,
  chatViewCss,
  chatViewHtml,
  prepareChatMessages,
} from "~/utils/pdf/chatView";
import { CHAT_SAMPLE_COUNT } from "~/utils/pdf/chatPdf";
import { pdfFontFaceCss } from "~/utils/pdf/fonts";

defineProps({
  title: { type: String, required: true },
  text: { type: String, default: "" },
  // analytics label for a one-time purchase made here
  checkoutSource: { type: String, required: true },
});

const { t, locale } = useI18n();
const STORAGE_KEY = "wa-chat-pdf-style";

// kept out of Vue's deep reactivity: Chat caches its lazy getters on itself,
// and proxying a whole chat is slow
const chat = shallowRef(null);
const attachments = shallowRef([]);
const source = shallowRef(null);
const { isSubscriptionValid } = storeToRefs(useSubscriptionStore());
const oneTimePurchase = useOneTimePurchase();

const styles = CHAT_STYLE_IDS.map((id) => CHAT_STYLES[id]);
const options = reactive(normalizeChatViewOptions(null, ""));

const participants = computed(() =>
  Object.keys(chat.value?.personColorMap || {}),
);

const hasFullAccess = computed(
  () =>
    !!chat.value &&
    (isSubscriptionValid.value ||
      unlocksChat(oneTimePurchase.value, chatFingerprint(toRaw(chat.value)))),
);

// A chat restored from the browser session keeps its attachments' names but
// not the files, so its photos cannot be shown until the export is dropped
// again.
const mediaNotLoaded = computed(
  () =>
    attachments.value.length > 0 &&
    attachments.value.every((file) => !file.zipEntry && !file.decompressedData),
);

/** The other person in a one-on-one chat, or the group's members. */
const chatTitle = computed(() => {
  const others = participants.value.filter((name) => name !== options.me);
  if (others.length === 0) return options.me || "WhatsApp";
  if (others.length === 1) return others[0];
  const shown = others.slice(0, 3).join(", ");
  return others.length > 3 ? `${shown} +${others.length - 3}` : shown;
});

function formatDay(date) {
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: "medium",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

/** Labels for a document that prints `printed` of the chat's messages. */
function labels(printed, total) {
  const messages = chat.value?.chatObject || [];
  return {
    subtitle: t("pdfTool.subtitle", {
      count: total.toLocaleString(locale.value),
      from: formatDay(messages[0]?.date),
      to: formatDay(messages.at(-1)?.date),
    }),
    notice:
      printed < total
        ? t("pdfTool.previewNotice", {
            shown: printed.toLocaleString(locale.value),
            total: total.toLocaleString(locale.value),
          })
        : "",
  };
}

const chatView = computed(() => ({
  options: { ...options },
  title: chatTitle.value,
  labels,
  locale: locale.value,
}));

// ----- preview: the free sample's messages, in the chosen look
const previewMessages = shallowRef([]);
const previewCount = computed(() => previewMessages.value.length);

async function prepare(count) {
  const all = chat.value?.chatObject || [];
  return await prepareChatMessages(
    all.slice(0, count),
    toRaw(attachments.value),
    participants.value,
    { showMedia: options.showMedia },
  );
}

watch(
  () => [chat.value, options.showMedia],
  async () => {
    if (!chat.value) return;
    previewMessages.value = markRaw(await prepare(CHAT_SAMPLE_COUNT));
  },
);

function documentHtml(messages) {
  const total = chat.value?.chatObject.length || 0;
  return chatViewHtml(
    {
      title: chatTitle.value,
      labels: labels(messages.length, total),
      messages,
      colors: chat.value?.personColorMap || {},
      locale: locale.value,
    },
    options,
  );
}

const previewHtml = computed(() => documentHtml(previewMessages.value));
const previewCss = computed(() => chatViewCss(options, "screen"));

// ----- printing with the browser's own dialog (Print button or Ctrl+P)
// Only `#cv-print-root` is printed while `html.cv-printing` is set; see
// chatPrintGlobalCss. Ctrl+P prints the preview; the button prints the whole
// chat for those who have it.
const printing = shallowRef(false);
let printHtml = null;
let globalStyle = null;

function updateGlobalStyle() {
  if (!globalStyle) return;
  globalStyle.textContent = chatPrintGlobalCss(options, pdfFontFaceCss());
}

function beforePrint() {
  if (!chat.value) return;
  const root = document.createElement("div");
  root.id = "cv-print-root";
  root.attachShadow({ mode: "open" }).innerHTML =
    `<style>${chatViewCss(options, "screen")}</style><div class="cv-root">${
      printHtml || previewHtml.value
    }</div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add("cv-printing");
}

function afterPrint() {
  document.getElementById("cv-print-root")?.remove();
  document.documentElement.classList.remove("cv-printing");
  printHtml = null;
}

async function printChat() {
  if (printing.value) return;
  printing.value = true;
  try {
    if (hasFullAccess.value) {
      printHtml = documentHtml(await prepare(chat.value.chatObject.length));
    }
    window.print();
  } finally {
    printing.value = false;
  }
}

// ----- the look is remembered on this device, so a buyer coming back from
// checkout gets the PDF in the style they chose
function loadStoredOptions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

watch(
  () => [options.style, options.textSize, options.showTimes, options.showMedia],
  () => {
    updateGlobalStyle();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          style: options.style,
          textSize: options.textSize,
          showTimes: options.showTimes,
          showMedia: options.showMedia,
        }),
      );
    } catch {
      // storage refused (private mode): the choice lasts for this page only
    }
  },
);

function onChatAnalyzed(payload) {
  chat.value = markRaw(new Chat(payload.messages));
  attachments.value = payload.attachments || [];
  source.value = payload.source || null;
  // the most active participant, like the analysis; changeable above
  if (!participants.value.includes(options.me)) {
    options.me = chat.value.messagesPerPerson[0]?.name || participants.value[0];
  }
  options.showNames = participants.value.length > 2;
  nextTick(() => scrollToSettled("#chat-pdf-tool", { offset: 80 }));
}

onMounted(() => {
  const stored = loadStoredOptions();
  if (stored)
    Object.assign(options, normalizeChatViewOptions(stored, options.me));

  globalStyle = document.createElement("style");
  globalStyle.id = "cv-print-style";
  document.head.appendChild(globalStyle);
  updateGlobalStyle();

  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeprint", beforePrint);
  window.removeEventListener("afterprint", afterPrint);
  globalStyle?.remove();
  afterPrint();
});
</script>

<style lang="scss" scoped>
#dropzone-slot {
  margin-top: 2.5rem;
  scroll-margin-top: 6rem;
}

.chat-pdf {
  max-width: 1080px;
  margin: 3rem auto 0;
  scroll-margin-top: 6rem;
}

.chat-pdf__note {
  margin: 0 0 1rem;
  padding: 0.9rem 1.1rem;
  border-radius: $wa-radius-md;
  background: rgba(33, 166, 141, 0.08);
  color: $wa-ink-muted;
  font-size: 0.875rem;
  line-height: 1.5;
}

.chat-pdf__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;

  @media (min-width: 900px) {
    grid-template-columns: 320px minmax(0, 1fr);
    align-items: start;
  }
}

.chat-pdf__controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
}

.chat-pdf__group {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;

  legend {
    margin-bottom: 0.75rem;
    font-weight: 700;
    color: $wa-ink;
  }
}

.chat-pdf__styles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 0.6rem;
}

.style-option {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.4rem;
  border: 2px solid $wa-border;
  border-radius: $wa-radius-md;
  background: $wa-surface-white;
  cursor: pointer;
  text-align: center;

  &.is-selected {
    border-color: $wa-accent;
  }

  &:focus-within {
    outline: 2px solid $wa-accent;
    outline-offset: 2px;
  }
}

.style-option__swatch {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 56px;
  padding: 8px;
  border-radius: 6px;
}

.style-option__bubble {
  display: block;
  width: 62%;
  height: 14px;

  &.is-out {
    align-self: flex-end;
  }
}

.style-option__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: $wa-ink;
  line-height: 1.2;
}

.chat-pdf__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
  font-size: 0.9rem;
  color: $wa-ink-muted;

  select {
    padding: 0.5rem 0.6rem;
    border: 1px solid $wa-border;
    border-radius: $wa-radius-md;
    background: $wa-surface-white;
    color: $wa-ink;
    font: inherit;
    appearance: auto;
  }
}

.segmented {
  display: inline-flex;
  border: 1px solid $wa-border;
  border-radius: $wa-radius-md;
  overflow: hidden;

  label {
    flex: 1;
    padding: 0.4rem 0.9rem;
    text-align: center;
    cursor: pointer;
    color: $wa-ink;

    &.is-selected {
      background: $wa-accent;
      color: #ffffff;
    }

    &:focus-within {
      outline: 2px solid $wa-accent;
      outline-offset: -2px;
    }
  }
}

.chat-pdf__check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: $wa-ink;
  cursor: pointer;

  input {
    width: 1.05rem;
    height: 1.05rem;
    accent-color: $wa-accent;
  }
}

.chat-pdf__print {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1px solid $wa-accent;
  border-radius: $wa-radius-md;
  background: $wa-surface-white;
  color: $wa-accent;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }
}

.chat-pdf__hint {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: $wa-ink-faint;
}

.chat-pdf__preview-label {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  color: $wa-ink-muted;
  text-align: left;
}

.chat-pdf__download {
  margin-top: 3rem;
  scroll-margin-top: 6rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
