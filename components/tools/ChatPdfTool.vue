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
              <!-- Pro: a palette of the buyer's own colours -->
              <label
                class="style-option"
                :class="{ 'is-selected': options.style === 'custom' }"
              >
                <input
                  v-model="options.style"
                  type="radio"
                  name="chat-style"
                  value="custom"
                  class="visually-hidden"
                  data-style="custom"
                />
                <span
                  class="style-option__swatch"
                  :style="{ background: options.colors.page }"
                  aria-hidden="true"
                >
                  <span
                    class="style-option__bubble"
                    :style="{ background: options.colors.bubbleIn }"
                  />
                  <span
                    class="style-option__bubble is-out"
                    :style="{ background: options.colors.bubbleOut }"
                  />
                </span>
                <span class="style-option__label">
                  {{ t("pdfTool.style.custom") }}
                  <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
                </span>
              </label>
            </div>
          </fieldset>

          <ChatPdfDesign />

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
              {{ printing ? t("pdfTool.printPreparing") : t("pdfTool.print") }}
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
          <div class="chat-pdf__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              :aria-selected="previewTab === 'chat'"
              :class="{ 'is-selected': previewTab === 'chat' }"
              @click="previewTab = 'chat'"
            >
              {{ t("pdfTool.previewLabel", { count: previewCount }) }}
            </button>
            <button
              type="button"
              role="tab"
              data-tab="cover"
              :aria-selected="previewTab === 'cover'"
              :class="{ 'is-selected': previewTab === 'cover' }"
              @click="previewTab = 'cover'"
            >
              {{ t("pdfTool.design.coverPreviewLabel") }}
            </button>
          </div>
          <ChatPreview
            v-show="previewTab === 'chat'"
            :html="previewHtml"
            :css="previewCss"
            :background="wallpaperUrl"
          />
          <CoverPreview
            v-if="previewTab === 'cover'"
            :html="coverPreviewHtml"
            :css="coverPreviewCss"
            :background="coverPreviewColor"
            :page-width="pageWidth"
            :page-height="pageHeight"
            :margin="pageMargin"
          />
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
  provide,
  reactive,
  ref,
  shallowRef,
  toRaw,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import ToolDropzone from "~/components/tools/ToolDropzone.vue";
import ChatPreview from "~/components/tools/ChatPreview.vue";
import ChatPdfDesign from "~/components/tools/ChatPdfDesign.vue";
import CoverPreview from "~/components/tools/CoverPreview.vue";
import PdfDownloadPopup from "~/components/ChatVisualization/PdfDownloadPopup.vue";
import OneTimePurchaseReturn from "~/components/ChatVisualization/OneTimePurchaseReturn.vue";
import { Chat } from "~/utils/transformChatData";
import { useSubscriptionStore } from "~/stores/subscription";
import { chatFingerprint } from "~/utils/chatFingerprint";
import { chatDurationInDays } from "~/utils/utils";
import { ONE_TIME_PRICE, formatPrice } from "~/utils/pricing";
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
import {
  CHAT_GEOMETRY,
  CHAT_SAMPLE_COUNT,
  renderChatViewPdf,
} from "~/utils/pdf/chatPdf";
import {
  coverPhoto as prepareCoverPhoto,
  designForAccess,
  patternWallpaper,
  photoWallpaper,
  resolveStyle,
} from "~/utils/pdf/chatDesign";
import { chatCoverHtml, chatPagesCss, coverColor } from "~/utils/pdf/chatPages";
import { contentHeightPx, pageWidthPx, px } from "~/utils/pdf/page";
import {
  clearDesignImage,
  loadDesignImage,
  saveDesignImage,
} from "~/utils/pdf/designStore";
import { getAttachmentBytes } from "~/utils/attachments";
import logo from "~/assets/whatsanalyze-logo-green-PWA.png";
import { pdfFontFaceCss } from "~/utils/pdf/fonts";

defineProps({
  title: { type: String, required: true },
  text: { type: String, default: "" },
  // analytics label for a one-time purchase made here
  checkoutSource: { type: String, required: true },
});

const { t, locale } = useI18n();
const localePath = useLocalePath();
const { baseUrl } = useRuntimeConfig().public;
const STORAGE_KEY = "wa-chat-pdf-style";
// The cover's words are about this chat: kept for the tab only.
const COVER_KEY = "wa-chat-pdf-cover";

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

/**
 * A link printed in the PDF: clickable with campaign parameters, so visits
 * from a PDF show up in analytics, and printed without them, so it can be
 * typed in from paper.
 */
function pdfLink(path, campaign) {
  const clean = `${baseUrl}${localePath(path)}`;
  return {
    url: `${clean}?utm_source=chat_pdf&utm_medium=pdf&utm_campaign=${campaign}`,
    text: clean.replace(/^https?:\/\//, ""),
  };
}

const count = (value) => Number(value).toLocaleString(locale.value);

function coverContent(printed, total, design = options) {
  const messages = chat.value?.chatObject || [];
  const first = messages[0]?.date;
  const last = messages.at(-1)?.date;
  const people = participants.value;
  const members =
    people.length > 12
      ? `${people.slice(0, 12).join(", ")} +${people.length - 12}`
      : people.join(", ");
  return {
    brand: "WhatsAnalyze",
    eyebrow: t("pdfTool.cover.eyebrow"),
    title: design.cover?.title?.trim() || chatTitle.value,
    dedication: design.cover?.dedication || "",
    members,
    period: `${formatDay(first)} – ${formatDay(last)}`,
    stats: [
      { value: count(total), label: t("pdfTool.cover.messages") },
      {
        value: count(chatDurationInDays(first, last)),
        label: t("pdfTool.cover.days"),
      },
      { value: count(people.length), label: t("pdfTool.cover.people") },
    ],
    badge:
      printed < total
        ? t("pdfTool.cover.badge", { count: count(printed) })
        : "",
    footer: t("pdfTool.cover.footer"),
    link: pdfLink("/tools/whatsapp-to-pdf", "cover"),
  };
}

/** The last page of a preview: what is missing, and where to get it. */
function outroContent(printed, total) {
  if (printed >= total) return null;
  const product = (key, path) => ({
    title: t(`pdfTool.outro.${key}Title`),
    text: t(`pdfTool.outro.${key}Text`),
    link: pdfLink(path, "preview_outro"),
  });
  return {
    title: t("pdfTool.outro.title"),
    missing: count(total - printed),
    missingLabel: t("pdfTool.outro.missingLabel"),
    progress: t("pdfTool.outro.progress", {
      shown: count(printed),
      total: count(total),
    }),
    shownRatio: printed / total,
    ctaTitle: t("pdfTool.outro.ctaTitle"),
    ctaText: t("pdfTool.outro.ctaText", {
      price: formatPrice(ONE_TIME_PRICE, locale.value),
    }),
    ctaLink: pdfLink("/tools/whatsapp-to-pdf", "preview_outro"),
    moreTitle: t("pdfTool.outro.moreTitle"),
    products: [
      product("analysis", "/"),
      product("ai", "/tools/ai-chat-analyzer"),
      product("court", "/tools/court-evidence"),
      product("wrapped", "/wrapped"),
    ],
    privacy: t("pdfTool.outro.privacy"),
  };
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
    // what may be printed: the Pro cover only with full access
    cover: coverContent(printed, total, printableOptions.value),
    outro: outroContent(printed, total),
  };
}

/** The design as the PDF may print it: Pro parts only with full access. */
const printableOptions = computed(() =>
  designForAccess(options, hasFullAccess.value),
);

/** Deep copy: the renderer must not see later edits mid-build. */
const snapshot = (value) => JSON.parse(JSON.stringify(value));

const printableAssets = computed(() =>
  hasFullAccess.value
    ? {
        wallpaper: wallpaperUrl.value || null,
        coverPhoto: options.cover.photo ? coverPhotoUrl.value || null : null,
      }
    : {},
);

const chatView = computed(() => ({
  options: snapshot(printableOptions.value),
  title: chatTitle.value,
  labels,
  locale: locale.value,
  assets: printableAssets.value,
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

function documentHtml(messages, design = options) {
  const total = chat.value?.chatObject.length || 0;
  return chatViewHtml(
    {
      title: chatTitle.value,
      labels: labels(messages.length, total),
      messages,
      colors: chat.value?.personColorMap || {},
      locale: locale.value,
    },
    design,
  );
}

const previewHtml = computed(() => documentHtml(previewMessages.value));
const previewCss = computed(() => chatViewCss(options, "screen"));

// ----- Pro design: wallpaper, cover photo and the cover preview
// Everyone sees their design in the preview; printableOptions decides what
// the PDF carries.
const previewTab = ref("chat");
const wallpaperUrl = ref("");
const wallpaperSource = shallowRef(null);
const coverPhotoUrl = ref("");
const coverPick = ref(null);
const chatImages = shallowRef([]);

const pageWidth = pageWidthPx(CHAT_GEOMETRY);
const pageHeight = px(CHAT_GEOMETRY.heightMm);
const pageMargin = px(CHAT_GEOMETRY.margin.left);

let wallpaperTimer = null;
function refreshWallpaper() {
  clearTimeout(wallpaperTimer);
  // Debounced: dragging a colour picker or the fade slider fires constantly.
  wallpaperTimer = setTimeout(async () => {
    const choice = options.wallpaper;
    const style = resolveStyle(options);
    try {
      if (choice.kind === "pattern") {
        wallpaperUrl.value = patternWallpaper(choice.pattern, style);
      } else if (choice.kind === "photo" && wallpaperSource.value) {
        wallpaperUrl.value = await photoWallpaper(
          wallpaperSource.value,
          style.page,
          choice.dim,
        );
      } else {
        wallpaperUrl.value = "";
      }
    } catch (error) {
      console.error("Could not prepare the background", error);
      wallpaperUrl.value = "";
    }
  }, 120);
}

watch(
  () => [
    options.wallpaper.kind,
    options.wallpaper.pattern,
    options.wallpaper.dim,
    options.style,
    options.colors.page,
    options.colors.bubbleIn,
  ],
  refreshWallpaper,
);

async function setWallpaperPhoto(file) {
  wallpaperSource.value = file;
  options.wallpaper.kind = "photo";
  refreshWallpaper();
  await saveDesignImage("wallpaper", file);
}

async function setCoverPhoto(blob, fileName = null) {
  coverPick.value = fileName;
  if (!blob) {
    options.cover.photo = false;
    coverPhotoUrl.value = "";
    await clearDesignImage("cover");
    return;
  }
  try {
    coverPhotoUrl.value = await prepareCoverPhoto(blob);
    options.cover.photo = true;
    await saveDesignImage("cover", blob);
  } catch (error) {
    console.error("Could not read the cover photo", error);
  }
}

/** Photos in the chat itself, offered as cover photos. */
async function collectChatImages() {
  for (const image of chatImages.value) URL.revokeObjectURL(image.url);
  chatImages.value = [];
  const found = [];
  const seen = new Set();
  for (const message of chat.value?.chatObject || []) {
    const fileName = message.attachment?.fileName;
    if (!fileName || seen.has(fileName) || !/\.(jpe?g|png)$/i.test(fileName)) {
      continue;
    }
    seen.add(fileName);
    const bytes = await getAttachmentBytes(fileName, toRaw(attachments.value));
    if (!bytes) continue;
    const blob = new Blob([bytes], {
      type: /\.png$/i.test(fileName) ? "image/png" : "image/jpeg",
    });
    found.push({ fileName, blob, url: URL.createObjectURL(blob) });
    if (found.length >= 12) break;
  }
  chatImages.value = markRaw(found);
}

const pageColor = computed(() => resolveStyle(options).page);

provide("chatPdfDesign", {
  options,
  hasFullAccess,
  chatTitle,
  pageColor,
  chatImages,
  coverPick,
  setWallpaperPhoto,
  setCoverPhoto,
});

// The cover as it will print with this design (the full design: this is
// where it is tried out).
const coverPreviewHtml = computed(() => {
  if (!chat.value) return "";
  const total = chat.value.chatObject.length;
  const printed = hasFullAccess.value
    ? total
    : Math.min(total, CHAT_SAMPLE_COUNT);
  return chatCoverHtml(
    coverContent(printed, total, options),
    logo,
    options.cover.photo ? coverPhotoUrl.value || null : null,
  );
});
const coverPreviewCss = computed(() =>
  chatPagesCss(options, contentHeightPx(CHAT_GEOMETRY)),
);
const coverPreviewColor = computed(() => coverColor(options));

// ----- printing
// The Print button prints the PDF itself: the same file the download gives,
// so it looks the same from every browser. Printing the page through CSS is
// at the mercy of each engine (Safari ignores named pages, paints no
// wallpaper in the margins and adds its own URL and date there).
//
// The browser's own print (Ctrl+P, or Share > Print on a phone) still works:
// only `#cv-print-root` is printed while `html.cv-printing` is set, see
// chatPrintGlobalCss. That path prints the preview.
const printing = shallowRef(false);
let globalStyle = null;
let printUrl = null;

function updateGlobalStyle() {
  if (!globalStyle) return;
  globalStyle.textContent = chatPrintGlobalCss(options, pdfFontFaceCss());
}

function beforePrint() {
  if (!chat.value) return;
  // Browsers may fire beforeprint more than once for one print (a preview
  // re-render, a programmatic print after Ctrl+P): never print two copies.
  document.getElementById("cv-print-root")?.remove();
  const root = document.createElement("div");
  root.id = "cv-print-root";
  const design = printableOptions.value;
  const shadow = root.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${chatViewCss(design, "screen")}</style><div class="cv-root">${documentHtml(
    previewMessages.value,
    design,
  )}</div>`;
  const wallpaper = printableAssets.value.wallpaper;
  if (wallpaper) {
    const chatRoot = shadow.querySelector(".cv-root");
    chatRoot.style.backgroundImage = `url("${wallpaper}")`;
    chatRoot.style.backgroundSize = "100% auto";
  }
  document.body.appendChild(root);
  document.documentElement.classList.add("cv-printing");
}

function afterPrint() {
  document.getElementById("cv-print-root")?.remove();
  document.documentElement.classList.remove("cv-printing");
}

/**
 * Safari (macOS and every browser on iOS) prints a PDF from a frame as a
 * blank page, if at all. There the PDF opens in a tab instead, where the
 * system viewer prints and shares it.
 */
function opensPdfInTab() {
  const ua = navigator.userAgent;
  const iOS =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari =
    /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  return iOS || safari;
}

function releasePrintUrl() {
  document.getElementById("cv-print-frame")?.remove();
  if (printUrl) URL.revokeObjectURL(printUrl);
  printUrl = null;
}

function printInFrame(url) {
  const frame = document.createElement("iframe");
  frame.id = "cv-print-frame";
  frame.setAttribute("aria-hidden", "true");
  // Off screen rather than hidden: a hidden frame never loads the PDF viewer.
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.addEventListener("load", () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      window.open(url, "_blank");
    }
  });
  frame.src = url;
  document.body.appendChild(frame);
}

async function printChat() {
  if (printing.value || !chat.value) return;
  printing.value = true;
  // Opened now, while the click still counts as one: a window opened after
  // the PDF is built would be blocked as a popup.
  const tab = opensPdfInTab() ? window.open("", "_blank") : null;
  try {
    const blob = await renderChatViewPdf({
      chat: toRaw(chat.value),
      attachments: toRaw(attachments.value),
      options: snapshot(printableOptions.value),
      title: chatTitle.value,
      labels,
      locale: locale.value,
      isSample: !hasFullAccess.value,
      assets: printableAssets.value,
    });
    releasePrintUrl();
    printUrl = URL.createObjectURL(blob);
    if (tab) tab.location.href = printUrl;
    else printInFrame(printUrl);
  } catch (error) {
    tab?.close();
    console.error("Could not print the chat", error);
  } finally {
    printing.value = false;
  }
}

function loadStoredCover() {
  try {
    return JSON.parse(sessionStorage.getItem(COVER_KEY) || "null");
  } catch {
    return null;
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
  () => [
    options.style,
    options.textSize,
    options.showTimes,
    options.showMedia,
    options.baseStyle,
    { ...options.colors },
    { ...options.wallpaper },
  ],
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
          baseStyle: options.baseStyle,
          colors: options.colors,
          wallpaper: options.wallpaper,
        }),
      );
    } catch {
      // storage refused (private mode): the choice lasts for this page only
    }
  },
  { deep: true },
);

watch(
  () => ({ ...options.cover }),
  (cover) => {
    try {
      sessionStorage.setItem(COVER_KEY, JSON.stringify(cover));
    } catch {
      // the cover just has to be filled in again after a reload
    }
  },
);

// A custom palette starts from the preset on screen, and a preset picked
// later becomes the one a custom palette falls back to.
watch(
  () => options.style,
  (style, previous) => {
    if (style !== "custom") {
      options.baseStyle = style;
      return;
    }
    if (previous && previous !== "custom" && !customColorsTouched()) {
      const preset = resolveStyle({ ...options, style: previous });
      options.colors = {
        page: preset.page,
        bubbleIn: preset.bubbleIn,
        bubbleOut: preset.bubbleOut,
        accent: "#21a68d",
      };
    }
  },
);

function customColorsTouched() {
  try {
    return !!JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
      .customTouched;
  } catch {
    return false;
  }
}

watch(
  () => ({ ...options.colors }),
  () => {
    if (options.style !== "custom") return;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...stored, customTouched: true }),
      );
    } catch {
      // nothing to remember without storage
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
  void collectChatImages();
  nextTick(() => scrollToSettled("#chat-pdf-tool", { offset: 80 }));
}

/** The design's photos from earlier in this tab (e.g. before checkout). */
async function restoreDesignImages() {
  const wallpaper = await loadDesignImage("wallpaper");
  if (wallpaper) wallpaperSource.value = wallpaper;
  const cover = await loadDesignImage("cover");
  if (cover && options.cover.photo) {
    coverPhotoUrl.value = await prepareCoverPhoto(cover).catch(() => "");
  } else {
    options.cover.photo = false;
  }
  if (options.wallpaper.kind === "photo" && !wallpaper) {
    options.wallpaper.kind = "none";
  }
  refreshWallpaper();
}

onMounted(() => {
  const stored = loadStoredOptions();
  const cover = loadStoredCover();
  if (stored || cover) {
    Object.assign(
      options,
      normalizeChatViewOptions({ ...(stored || {}), cover }, options.me),
    );
  }
  void restoreDesignImages();

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
  releasePrintUrl();
  clearTimeout(wallpaperTimer);
  for (const image of chatImages.value) URL.revokeObjectURL(image.url);
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

.chat-pdf__tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.6rem;

  button {
    padding: 0.35rem 0.8rem;
    border: 1px solid $wa-border;
    border-radius: 999px;
    background: $wa-surface-white;
    color: $wa-ink-muted;
    font-size: 0.82rem;
    cursor: pointer;

    &.is-selected {
      border-color: $wa-accent;
      color: $wa-accent;
      font-weight: 700;
    }
  }
}

.pro-chip {
  display: inline-block;
  margin-left: 0.25rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: #7c3aed;
  color: #ffffff;
  font-size: 0.6rem;
  font-weight: 700;
  vertical-align: middle;
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
