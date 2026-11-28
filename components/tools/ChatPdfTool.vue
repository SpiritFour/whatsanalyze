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
          <!-- Three short panels instead of one long column, so the preview
               stays in sight while something is changed. -->
          <div
            class="chat-pdf__control-tabs"
            role="tablist"
            :aria-label="t('pdfTool.tabsLabel')"
            @keydown="onTabKey($event, controlTabs, controlTab, setControlTab)"
          >
            <button
              v-for="tab in controlTabs"
              :id="`cv-tab-${tab}`"
              :key="tab"
              type="button"
              role="tab"
              :data-controls="tab"
              :aria-selected="controlTab === tab"
              :aria-controls="`cv-panel-${tab}`"
              :tabindex="controlTab === tab ? 0 : -1"
              :class="{ 'is-selected': controlTab === tab }"
              @click="setControlTab(tab)"
            >
              {{ t(`pdfTool.tabs.${tab}`) }}
              <span v-if="tab === 'design'" class="pro-chip">{{
                t("pdfTool.design.pro")
              }}</span>
            </button>
          </div>

          <div
            v-show="controlTab === 'look'"
            id="cv-panel-look"
            role="tabpanel"
            aria-labelledby="cv-tab-look"
            class="chat-pdf__panel"
          >
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
                    <span v-if="style.pro" class="pro-chip">{{
                      t("pdfTool.design.pro")
                    }}</span>
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

            <fieldset class="chat-pdf__group">
              <legend>{{ t("pdfTool.layoutTitle") }}</legend>
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
              <div class="chat-pdf__field" role="radiogroup">
                <span id="chat-pdf-paper">{{ t("pdfTool.paper") }}</span>
                <div class="segmented" aria-labelledby="chat-pdf-paper">
                  <label
                    v-for="paper in ['a4', 'letter', 'a5']"
                    :key="paper"
                    :class="{ 'is-selected': options.paper === paper }"
                  >
                    <input
                      v-model="options.paper"
                      type="radio"
                      name="chat-paper"
                      :value="paper"
                      class="visually-hidden"
                    />
                    {{ t(`pdfTool.paperSize.${paper}`) }}
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <!-- v-show keeps the panel's state; while hidden, its font chips
               are not displayed, so the fonts are not downloaded. -->
          <div
            v-show="controlTab === 'design'"
            id="cv-panel-design"
            role="tabpanel"
            aria-labelledby="cv-tab-design"
            class="chat-pdf__panel"
          >
            <ChatPdfDesign />
          </div>

          <div
            v-show="controlTab === 'content'"
            id="cv-panel-content"
            role="tabpanel"
            aria-labelledby="cv-tab-content"
            class="chat-pdf__panel"
          >
            <fieldset class="chat-pdf__group">
              <legend>{{ t("pdfTool.adjustTitle") }}</legend>
              <label class="chat-pdf__field">
                <span>{{ t("pdfTool.me") }}</span>
                <select v-model="options.me" name="chat-me">
                  <option
                    v-for="name in participants"
                    :key="name"
                    :value="name"
                  >
                    {{ name }}
                  </option>
                </select>
              </label>
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
              <label class="chat-pdf__check">
                <input
                  v-model="options.hideSystem"
                  type="checkbox"
                  name="chat-hide-system"
                />
                {{ t("pdfTool.hideSystem") }}
              </label>
              <label class="chat-pdf__check">
                <input
                  v-model="options.analysis"
                  type="checkbox"
                  name="chat-analysis"
                />
                {{ t("pdfTool.analysisPages") }}
              </label>

              <div class="chat-pdf__field">
                <span>{{ t("pdfTool.dateRange") }}</span>
                <div class="chat-pdf__dates">
                  <input
                    v-model="options.from"
                    type="date"
                    name="chat-from"
                    :min="chatDays.first"
                    :max="options.to || chatDays.last"
                    :aria-label="t('pdfTool.dateFrom')"
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    v-model="options.to"
                    type="date"
                    name="chat-to"
                    :min="options.from || chatDays.first"
                    :max="chatDays.last"
                    :aria-label="t('pdfTool.dateTo')"
                  />
                </div>
                <button
                  v-if="options.from || options.to"
                  type="button"
                  class="chat-pdf__link"
                  @click="
                    options.from = '';
                    options.to = '';
                  "
                >
                  {{ t("pdfTool.dateReset") }}
                </button>
              </div>
            </fieldset>
          </div>

          <div class="chat-pdf__actions">
            <button
              type="button"
              class="chat-pdf__print"
              :disabled="printing || isEmpty"
              :aria-busy="printing ? 'true' : null"
              @click="printChat"
            >
              <span
                v-if="printing"
                class="chat-pdf__spinner"
                aria-hidden="true"
              ></span>
              <template v-if="printing">
                {{ t("pdfTool.printPreparing") }}
                <span v-if="printProgress" class="chat-pdf__percent"
                  >{{ printProgress }}%</span
                >
              </template>
              <template v-else>{{ t("pdfTool.print") }}</template>
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
          <div
            class="chat-pdf__tabs"
            role="tablist"
            :aria-label="t('pdfTool.previewTabsLabel')"
            @keydown="onTabKey($event, previewTabs, previewTab, setPreviewTab)"
          >
            <button
              id="cv-ptab-chat"
              type="button"
              role="tab"
              aria-controls="cv-ppanel-chat"
              :aria-selected="previewTab === 'chat'"
              :tabindex="previewTab === 'chat' ? 0 : -1"
              :class="{ 'is-selected': previewTab === 'chat' }"
              @click="setPreviewTab('chat')"
            >
              {{ t("pdfTool.previewLabel", { count: previewCount }) }}
            </button>
            <button
              id="cv-ptab-cover"
              type="button"
              role="tab"
              data-tab="cover"
              aria-controls="cv-ppanel-cover"
              :aria-selected="previewTab === 'cover'"
              :tabindex="previewTab === 'cover' ? 0 : -1"
              :class="{ 'is-selected': previewTab === 'cover' }"
              @click="setPreviewTab('cover')"
            >
              {{ t("pdfTool.design.coverPreviewLabel") }}
            </button>
          </div>
          <p v-if="isEmpty" class="chat-pdf__empty" data-empty role="status">
            {{ t("pdfTool.empty") }}
          </p>
          <ChatPreview
            v-show="previewTab === 'chat' && !isEmpty"
            id="cv-ppanel-chat"
            role="tabpanel"
            aria-labelledby="cv-ptab-chat"
            :label="t('pdfTool.previewRegion')"
            :html="previewHtml"
            :css="previewCss"
            :background="wallpaperUrl"
          />
          <CoverPreview
            v-if="previewTab === 'cover'"
            id="cv-ppanel-cover"
            role="tabpanel"
            aria-labelledby="cv-ptab-cover"
            :html="coverPreviewHtml"
            :css="coverPreviewCss"
            :background="coverPreviewColor"
            :page-width="pageWidth"
            :page-height="pageHeight"
            :margin="pageMargin"
          />
        </div>
      </div>

      <!-- Said where the decision is made: the free PDF leaves the Pro
           parts of the design out. -->
      <p
        v-if="!hasFullAccess && premiumDesign && !isEmpty"
        class="chat-pdf__pro-note"
        data-pro-download-note
      >
        <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
        {{ t("pdfTool.design.proDownloadNote") }}
      </p>
      <p v-if="isEmpty" class="chat-pdf__empty chat-pdf__download">
        {{ t("pdfTool.empty") }}
      </p>
      <!-- #payButton: where PdfDownloadPopup scrolls a returning buyer -->
      <div v-else id="payButton" class="chat-pdf__download">
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
import {
  chatCoverContent,
  chatPdfLabels,
  chatTitleFor,
} from "~/utils/pdf/chatLabels";
import { ONE_TIME_PRICE, formatPrice } from "~/utils/pricing";
import { scrollToSettled } from "~/utils/scroll";
import {
  CHAT_STYLES,
  isProStyle,
  CHAT_STYLE_IDS,
  normalizeChatViewOptions,
} from "~/utils/pdf/chatStyles";
import {
  chatPrintGlobalCss,
  chatViewCss,
  chatViewHtml,
  coverFacesHtml,
  filterChatMessages,
  prepareChatMessages,
} from "~/utils/pdf/chatView";
import {
  CHAT_SAMPLE_COUNT,
  chatGeometry,
  renderChatViewPdf,
} from "~/utils/pdf/chatPdf";
import {
  coverPhoto as prepareCoverPhoto,
  avatarPhoto,
  designForAccess,
  hasCustomCover,
  isPremiumDesign,
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
import { charactersOf, fontsFor } from "~/utils/pdf/chatFonts";
import { anyEmoji } from "~/utils/pdf/builder";
import { defaultPaper } from "~/utils/pdf/paperDefault";
import { analyticsTools } from "~/composables/useAnalytics";
import { loadEmojiSprite } from "~/utils/pdf/emoji";

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
const chatTitle = computed(() => chatTitleFor(participants.value, options.me));

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

/** The messages after the content filters: what every output shows. */
const filteredMessages = computed(() =>
  markRaw(
    filterChatMessages(
      chat.value?.chatObject || [],
      options,
      participants.value,
    ),
  ),
);

/** The chat's first and last day, as bounds for the date range. */
const chatDays = computed(() => {
  const messages = chat.value?.chatObject || [];
  const iso = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  return { first: iso(messages[0]?.date), last: iso(messages.at(-1)?.date) };
});

const geometry = computed(() => chatGeometry(options.paper));

// The PDF's words, shared with the analyzer's download (utils/pdf/chatLabels).
const labelContext = computed(() => ({
  t,
  locale: locale.value,
  link: pdfLink,
  price: formatPrice(ONE_TIME_PRICE, locale.value),
}));
const chatFacts = computed(() => ({
  participants: participants.value,
  title: chatTitle.value,
  messages: filteredMessages.value,
}));

function coverContent(printed, total, design = options) {
  return chatCoverContent(
    labelContext.value,
    chatFacts.value,
    printed,
    total,
    design,
  );
}

/** Labels for a document that prints `printed` of the chat's messages. */
function labels(printed, total) {
  // what may be printed: the Pro cover only with full access
  return chatPdfLabels(
    labelContext.value,
    chatFacts.value,
    printableOptions.value,
    printed,
    total,
  );
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
        avatars: shownAvatars.value,
      }
    : {},
);

const chatView = computed(() => ({
  options: snapshot(printableOptions.value),
  title: chatTitle.value,
  labels,
  locale: locale.value,
  assets: printableAssets.value,
  // the popup awaits this, so a pending background change is included
  currentAssets,
}));

// ----- preview: the free sample's messages, in the chosen look
const previewMessages = shallowRef([]);

// Emoji as the PDF draws them (Twemoji artwork), not as this device's emoji
// font: fetched once, in one request, only for a chat that has emoji.
const emojiSprite = shallowRef(new Map());
watch(chat, async (current) => {
  if (!current || emojiSprite.value.size) return;
  const texts = [
    ...current.chatObject.map((message) => message.message),
    ...Object.keys(current.personColorMap || {}),
  ];
  if (!anyEmoji(texts)) return;
  emojiSprite.value = markRaw(await loadEmojiSprite());
});
const previewCount = computed(() => previewMessages.value.length);

async function prepare(count) {
  return await prepareChatMessages(
    filteredMessages.value.slice(0, count),
    toRaw(attachments.value),
    participants.value,
    { showMedia: options.showMedia },
  );
}

watch(
  () => [chat.value, options.showMedia, filteredMessages.value],
  async () => {
    if (!chat.value) return;
    previewMessages.value = markRaw(await prepare(CHAT_SAMPLE_COUNT));
  },
);

function documentHtml(messages, design = options) {
  const total = filteredMessages.value.length;
  return chatViewHtml(
    {
      title: chatTitle.value,
      labels: labels(messages.length, total),
      messages,
      colors: chat.value?.personColorMap || {},
      locale: locale.value,
      // the preview shows the whole design; what prints is decided by
      // printableAssets
      avatars:
        design === options ? shownAvatars.value : printableAssets.value.avatars,
    },
    design,
    emojiSprite.value,
  );
}

const previewHtml = computed(() => documentHtml(previewMessages.value));
const previewCss = computed(() => chatViewCss(options, "screen"));

// ----- Pro design: wallpaper, cover photo and the cover preview
// Everyone sees their design in the preview; printableOptions decides what
// the PDF carries.
const previewTab = ref("chat");
const controlTabs = ["look", "design", "content"];
const controlTab = ref("look");
const previewTabs = ["chat", "cover"];
const setControlTab = (tab) => (controlTab.value = tab);
const setPreviewTab = (tab) => (previewTab.value = tab);

/**
 * Arrow keys, Home and End move between tabs, and focus follows, as in any
 * tab list (WAI-ARIA authoring practices). Only the selected tab is in the
 * Tab order.
 */
function onTabKey(event, tabs, current, select) {
  const index = tabs.indexOf(current);
  const next = {
    ArrowRight: (index + 1) % tabs.length,
    ArrowLeft: (index - 1 + tabs.length) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  select(tabs[next]);
  const tabList = event.currentTarget;
  nextTick(() => tabList.querySelectorAll('[role="tab"]')[next]?.focus());
}

/** Nothing left after the content filters, e.g. a range with no messages. */
const isEmpty = computed(
  () => !!chat.value && filteredMessages.value.length === 0,
);
const premiumDesign = computed(() => isPremiumDesign(options));

// ----- analytics: what people try, and what the Pro note leads to
/** The design in coarse terms, one entry per option worth counting. */
const designSignature = computed(() => ({
  style: options.style,
  font: options.font,
  paper: options.paper,
  text_size: options.textSize,
  book: options.book,
  book_compact: options.bookCompact,
  background:
    options.wallpaper.kind === "pattern"
      ? options.wallpaper.pattern
      : options.wallpaper.kind,
  custom_cover: hasCustomCover(options),
  avatars: options.avatars.length > 0,
  hide_system: options.hideSystem,
  analysis: options.analysis,
  date_range: !!(options.from || options.to),
}));
const PRO_OPTIONS = new Set([
  "font",
  "book",
  "book_compact",
  "background",
  "custom_cover",
  "avatars",
]);
let trackedDesign = null;
let designTimer = null;
watch(designSignature, (signature) => {
  if (!chat.value) return;
  clearTimeout(designTimer);
  // Once per burst: a slider or a typed title is one change, not fifty.
  designTimer = setTimeout(() => {
    const previous = trackedDesign;
    trackedDesign = signature;
    if (!previous) return;
    for (const [option, value] of Object.entries(signature)) {
      if (previous[option] === value) continue;
      const pro =
        option === "style"
          ? value === "custom" || isProStyle(value)
          : PRO_OPTIONS.has(option) &&
            value !== false &&
            value !== "default" &&
            value !== "none";
      analyticsTools.pdfDesignChange(option, value, pro);
    }
  }, 800);
});

let proNoteTracked = false;
watch(
  () => !hasFullAccess.value && premiumDesign.value && !isEmpty.value,
  (shown) => {
    if (!shown || proNoteTracked) return;
    proNoteTracked = true;
    analyticsTools.pdfProNote("download");
  },
);
const wallpaperUrl = ref("");
const wallpaperSource = shallowRef(null);
const coverPhotoUrl = ref("");
const coverPick = ref(null);

// ----- profile pictures, by participant (Pro)
const avatarUrls = ref({});
/** The uploaded pictures of the people still marked as having one. */
const shownAvatars = computed(() =>
  Object.fromEntries(
    options.avatars
      .filter((name) => avatarUrls.value[name])
      .map((name) => [name, avatarUrls.value[name]]),
  ),
);

async function setAvatar(name, blob) {
  const key = `avatar:${name}`;
  if (!blob) {
    options.avatars = options.avatars.filter((other) => other !== name);
    const rest = { ...avatarUrls.value };
    delete rest[name];
    avatarUrls.value = rest;
    await clearDesignImage(key);
    return;
  }
  try {
    avatarUrls.value = { ...avatarUrls.value, [name]: await avatarPhoto(blob) };
    if (!options.avatars.includes(name)) {
      options.avatars = [...options.avatars, name];
    }
    await saveDesignImage(key, blob);
  } catch (error) {
    console.error("Could not read the profile picture", error);
  }
}
const chatImages = shallowRef([]);

const pageWidth = computed(() => pageWidthPx(geometry.value));
const pageHeight = computed(() => px(geometry.value.heightMm));
const pageMargin = computed(() => px(geometry.value.margin.left));

let wallpaperTimer = null;
/** The wallpaper being drawn right now, if any. */
let wallpaperWork = Promise.resolve();

function refreshWallpaper() {
  clearTimeout(wallpaperTimer);
  // Debounced: dragging a colour picker or the fade slider fires constantly.
  wallpaperTimer = setTimeout(() => {
    wallpaperTimer = null;
    wallpaperWork = drawWallpaper();
  }, 120);
}

/**
 * The design's pictures as they are now: a change still waiting out the
 * debounce is drawn first, so an export started right after a change never
 * prints the old wallpaper, or none.
 */
async function currentAssets() {
  if (wallpaperTimer) {
    clearTimeout(wallpaperTimer);
    wallpaperTimer = null;
    wallpaperWork = drawWallpaper();
  }
  await wallpaperWork;
  return printableAssets.value;
}

async function drawWallpaper() {
  const choice = options.wallpaper;
  const style = resolveStyle(options);
  try {
    if (choice.kind === "pattern") {
      wallpaperUrl.value = patternWallpaper(
        choice.pattern,
        style,
        geometry.value,
      );
    } else if (choice.kind === "photo" && wallpaperSource.value) {
      wallpaperUrl.value = await photoWallpaper(
        wallpaperSource.value,
        style.page,
        choice.dim,
        geometry.value,
      );
    } else {
      wallpaperUrl.value = "";
    }
  } catch (error) {
    console.error("Could not prepare the background", error);
    wallpaperUrl.value = "";
  }
}

watch(
  () => [
    options.wallpaper.kind,
    options.wallpaper.pattern,
    options.wallpaper.dim,
    options.style,
    options.colors.page,
    options.colors.bubbleIn,
    options.paper,
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

// ----- fonts that can draw this chat
// Every letter in the chat, its names and the cover's own words: a font is
// offered only if it has a glyph for all of them (utils/pdf/chatFonts.ts).
const chatCharacters = computed(() => {
  const messages = chat.value?.chatObject || [];
  return charactersOf([
    ...messages.map((message) => message.message),
    ...participants.value,
  ]);
});

const usableFonts = computed(() => {
  const characters = new Set(chatCharacters.value);
  for (const point of charactersOf([
    options.cover.title,
    options.cover.dedication,
  ])) {
    characters.add(point);
  }
  return fontsFor(characters);
});

// A font picked for an earlier chat may lack this one's letters.
watch(usableFonts, (fonts) => {
  if (!fonts.includes(options.font)) options.font = "default";
});

provide("chatPdfDesign", {
  options,
  usableFonts,
  hasFullAccess,
  chatTitle,
  pageColor,
  chatImages,
  coverPick,
  setWallpaperPhoto,
  setCoverPhoto,
  avatarUrls,
  setAvatar,
  participants,
});

// The cover as it will print with this design (the full design: this is
// where it is tried out).
const coverPreviewHtml = computed(() => {
  if (!chat.value) return "";
  const total = filteredMessages.value.length;
  const printed = hasFullAccess.value
    ? total
    : Math.min(total, CHAT_SAMPLE_COUNT);
  return chatCoverHtml(
    coverContent(printed, total, options),
    logo,
    options.cover.photo ? coverPhotoUrl.value || null : null,
    emojiSprite.value,
    coverFacesHtml(
      participants.value,
      { colors: chat.value.personColorMap || {}, avatars: shownAvatars.value },
      options,
      emojiSprite.value,
    ),
  );
});
const coverPreviewCss = computed(() =>
  chatPagesCss(options, contentHeightPx(geometry.value)),
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
const printProgress = shallowRef(0);
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
  printProgress.value = 0;
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
      assets: await currentAssets(),
      onProgress: (percent) => {
        printProgress.value = Math.round(percent);
      },
    });
    analyticsTools.pdfPrint(hasFullAccess.value);
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
    options.font,
    options.paper,
    options.book,
    options.bookCompact,
    options.hideSystem,
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
          font: options.font,
          paper: options.paper,
          book: options.book,
          bookCompact: options.bookCompact,
          hideSystem: options.hideSystem,
        }),
      );
    } catch {
      // storage refused (private mode): the choice lasts for this page only
    }
  },
  { deep: true },
);

// The cover's words and the date range are about this chat: tab only.
watch(
  () => ({
    ...options.cover,
    from: options.from,
    to: options.to,
    avatars: options.avatars.join("\n"),
  }),
  () => {
    try {
      sessionStorage.setItem(
        COVER_KEY,
        JSON.stringify({
          cover: options.cover,
          from: options.from,
          to: options.to,
          avatars: options.avatars,
        }),
      );
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
      // Only a free preset can be what a Pro style falls back to.
      if (!isProStyle(style)) options.baseStyle = style;
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
  trackedDesign = null;
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

  const restored = {};
  for (const name of options.avatars) {
    const blob = await loadDesignImage(`avatar:${name}`);
    if (blob) restored[name] = await avatarPhoto(blob).catch(() => "");
  }
  avatarUrls.value = restored;
  options.avatars = options.avatars.filter((name) => restored[name]);
}

onMounted(() => {
  const stored = loadStoredOptions();
  const tab = loadStoredCover();
  if (stored || tab) {
    Object.assign(
      options,
      normalizeChatViewOptions(
        {
          ...(stored || {}),
          cover: tab?.cover,
          avatars: tab?.avatars,
          from: tab?.from,
          to: tab?.to,
        },
        options.me,
      ),
    );
  }
  // First visit: the paper the visitor's region prints on.
  if (!stored?.paper) options.paper = defaultPaper();
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
  clearTimeout(designTimer);
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

/* Phones: the preview first, so a change made in the panel below can be
   seen by scrolling a little, not a whole column. Desktop: the preview stays
   in view next to the controls. */
.chat-pdf__preview {
  order: -1;
  min-width: 0;

  @media (min-width: 900px) {
    order: 0;
    position: sticky;
    top: 5.5rem;
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

  &[aria-busy="true"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 1;
  }
}

.chat-pdf__spinner {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border: 2px solid rgba(29, 29, 31, 0.15);
  border-top-color: $wa-accent;
  border-radius: 50%;
  animation: chat-pdf-spin 0.8s linear infinite;
}

.chat-pdf__percent {
  font-variant-numeric: tabular-nums;
}

@keyframes chat-pdf-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-pdf__spinner {
    animation-duration: 2.4s;
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

.chat-pdf__control-tabs {
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgba(17, 27, 33, 0.05);

  button {
    flex: 1;
    padding: 0.45rem 0.5rem;
    border: 0;
    border-radius: 999px;
    background: none;
    color: $wa-ink-muted;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;

    &.is-selected {
      background: $wa-surface-white;
      color: $wa-ink;
      box-shadow: 0 1px 4px rgba(17, 27, 33, 0.12);
    }
  }
}

.chat-pdf__panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chat-pdf__empty {
  margin: 0;
  padding: 2.5rem 1.5rem;
  border: 1px dashed $wa-border;
  border-radius: 14px;
  color: $wa-ink-muted;
  text-align: center;
}

.chat-pdf__pro-note {
  max-width: 640px;
  margin: 2.5rem auto -1.5rem;
  padding: 0.75rem 1rem;
  border-radius: $wa-radius-md;
  background: rgba(124, 58, 237, 0.08);
  color: $wa-ink-muted;
  font-size: 0.88rem;
  line-height: 1.45;
  text-align: center;

  .pro-chip {
    margin: 0 0.3rem 0 0;
  }
}

.chat-pdf__dates {
  display: flex;
  align-items: center;
  gap: 0.4rem;

  input {
    flex: 1;
    min-width: 0;
    padding: 0.4rem 0.5rem;
    border: 1px solid $wa-border;
    border-radius: $wa-radius-md;
    background: $wa-surface-white;
    color: $wa-ink;
    font: inherit;
    font-size: 0.85rem;
  }
}

.chat-pdf__link {
  align-self: flex-start;
  border: 0;
  background: none;
  padding: 0;
  color: $wa-accent;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
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
