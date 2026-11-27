<template>
  <!-- The Pro design controls of the WhatsApp-to-PDF tool. Everyone can try
       them in the preview; the PDF carries them with full access. State
       lives in ChatPdfTool and arrives through provide/inject. -->
  <div class="design">
    <p v-if="!design.hasFullAccess.value && premium" class="design__note">
      <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
      {{ t("pdfTool.design.proNote") }}
    </p>

    <!-- Custom colours -->
    <fieldset v-if="options.style === 'custom'" class="design__group">
      <legend>
        {{ t("pdfTool.design.colorsTitle") }}
        <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
      </legend>
      <div class="design__colors">
        <label v-for="key in colorKeys" :key="key" class="design__color">
          <input
            v-model="options.colors[key]"
            type="color"
            :name="`chat-color-${key}`"
          />
          <span>{{ t(`pdfTool.design.color.${key}`) }}</span>
        </label>
      </div>
    </fieldset>

    <!-- Background -->
    <details class="design__group" :open="options.wallpaper.kind !== 'none'">
      <summary>
        {{ t("pdfTool.design.backgroundTitle") }}
        <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
      </summary>
      <div class="design__chips" role="radiogroup">
        <label
          v-for="choice in backgroundChoices"
          :key="choice"
          class="chip"
          :class="{ 'is-selected': backgroundChoice === choice }"
        >
          <input
            type="radio"
            name="chat-background"
            class="visually-hidden"
            :value="choice"
            :checked="backgroundChoice === choice"
            :data-background="choice"
            @change="chooseBackground(choice)"
          />
          {{ t(`pdfTool.design.pattern.${choice}`) }}
        </label>
      </div>
      <div v-if="backgroundChoice === 'photo'" class="design__photo">
        <label class="design__file">
          <input
            type="file"
            accept="image/*"
            name="chat-background-photo"
            class="visually-hidden"
            @change="pickWallpaper"
          />
          {{ t("pdfTool.design.choosePhoto") }}
        </label>
        <label class="design__range">
          <span>{{ t("pdfTool.design.dim") }}</span>
          <input
            v-model.number="options.wallpaper.dim"
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            name="chat-background-dim"
          />
        </label>
      </div>
    </details>

    <!-- Font -->
    <fieldset class="design__group">
      <legend>
        {{ t("pdfTool.design.fontTitle") }}
        <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
      </legend>
      <div class="design__chips" role="radiogroup">
        <label
          v-for="font in fonts"
          :key="font"
          class="chip"
          :class="{ 'is-selected': options.font === font }"
          :style="{ fontFamily: fontPreview(font) }"
        >
          <input
            v-model="options.font"
            type="radio"
            name="chat-font"
            class="visually-hidden"
            :value="font"
            :data-font="font"
          />
          {{ t(`pdfTool.design.font.${font}`) }}
        </label>
      </div>
    </fieldset>

    <!-- Book layout -->
    <label class="design__check">
      <input v-model="options.book" type="checkbox" name="chat-book" />
      <span>
        {{ t("pdfTool.design.book") }}
        <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
        <small>{{ t("pdfTool.design.bookHint") }}</small>
      </span>
    </label>

    <!-- Cover -->
    <details class="design__group" :open="customCover">
      <summary>
        {{ t("pdfTool.design.coverTitle") }}
        <span class="pro-chip">{{ t("pdfTool.design.pro") }}</span>
      </summary>
      <label class="design__field">
        <span>{{ t("pdfTool.design.coverHeading") }}</span>
        <input
          v-model="options.cover.title"
          type="text"
          name="chat-cover-title"
          maxlength="80"
          :placeholder="design.chatTitle.value"
        />
      </label>
      <label class="design__field">
        <span>{{ t("pdfTool.design.coverDedication") }}</span>
        <textarea
          v-model="options.cover.dedication"
          name="chat-cover-dedication"
          rows="2"
          maxlength="200"
          :placeholder="t('pdfTool.design.coverDedicationPlaceholder')"
        />
      </label>
      <div class="design__field">
        <span>{{ t("pdfTool.design.coverColor") }}</span>
        <div class="design__inline">
          <input
            type="color"
            name="chat-cover-color"
            :value="options.cover.color || design.pageColor.value"
            @input="options.cover.color = $event.target.value"
          />
          <button
            v-if="options.cover.color"
            type="button"
            class="design__link"
            @click="options.cover.color = null"
          >
            {{ t("pdfTool.design.coverColorReset") }}
          </button>
        </div>
      </div>
      <div class="design__field">
        <span>{{ t("pdfTool.design.coverPhoto") }}</span>
        <div class="design__thumbs">
          <button
            v-for="image in design.chatImages.value"
            :key="image.fileName"
            type="button"
            class="design__thumb"
            :class="{
              'is-selected': design.coverPick.value === image.fileName,
            }"
            :aria-label="image.fileName"
            @click="design.setCoverPhoto(image.blob, image.fileName)"
          >
            <img :src="image.url" alt="" />
          </button>
        </div>
        <div class="design__inline">
          <label class="design__file">
            <input
              type="file"
              accept="image/*"
              name="chat-cover-photo"
              class="visually-hidden"
              @change="pickCover"
            />
            {{ t("pdfTool.design.coverPhotoUpload") }}
          </label>
          <button
            v-if="options.cover.photo"
            type="button"
            class="design__link"
            @click="design.setCoverPhoto(null)"
          >
            {{ t("pdfTool.design.removePhoto") }}
          </button>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
import { computed, inject } from "vue";
import {
  PATTERN_IDS,
  hasCustomCover,
  isPremiumDesign,
} from "~/utils/pdf/chatDesign";
import { CHAT_FONT_IDS, chatFontFamily } from "~/utils/pdf/chatFonts";

const { t } = useI18n();
const design = inject("chatPdfDesign");
const options = design.options;

const colorKeys = ["page", "bubbleIn", "bubbleOut", "accent"];
const fonts = CHAT_FONT_IDS;
// Each chip in its own typeface (declared on the page by ChatPdfTool).
const fontPreview = (font) => chatFontFamily(font);
const backgroundChoices = ["none", ...PATTERN_IDS, "photo"];

const premium = computed(() => isPremiumDesign(options));
const customCover = computed(() => hasCustomCover(options));

const backgroundChoice = computed(() =>
  options.wallpaper.kind === "pattern"
    ? options.wallpaper.pattern
    : options.wallpaper.kind,
);

function chooseBackground(choice) {
  if (choice === "none" || choice === "photo") {
    options.wallpaper.kind = choice;
  } else {
    options.wallpaper.kind = "pattern";
    options.wallpaper.pattern = choice;
  }
}

function pickWallpaper(event) {
  const file = event.target.files?.[0];
  if (file) design.setWallpaperPhoto(file);
}

function pickCover(event) {
  const file = event.target.files?.[0];
  if (file) design.setCoverPhoto(file, null);
}
</script>

<style lang="scss" scoped>
.design {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

.design__note {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: $wa-radius-md;
  background: rgba(124, 58, 237, 0.08);
  color: $wa-ink-muted;
  font-size: 0.85rem;
  line-height: 1.45;
}

.pro-chip {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: #7c3aed;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  vertical-align: middle;
}

.design__note .pro-chip {
  margin: 0 0.35rem 0 0;
}

.design__group {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;

  legend,
  summary {
    margin-bottom: 0.6rem;
    font-weight: 700;
    color: $wa-ink;
    cursor: pointer;
  }

  legend {
    cursor: default;
  }
}

.design__check {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: $wa-ink;
  cursor: pointer;

  input {
    width: 1.05rem;
    height: 1.05rem;
    margin-top: 0.15rem;
    accent-color: $wa-accent;
  }

  small {
    display: block;
    margin-top: 0.15rem;
    font-weight: 400;
    font-size: 0.8rem;
    color: $wa-ink-muted;
  }
}

.design__colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.design__color {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: $wa-ink;

  input {
    width: 2.2rem;
    height: 2.2rem;
    padding: 0;
    border: 1px solid $wa-border;
    border-radius: 8px;
    background: none;
    cursor: pointer;
  }
}

.design__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  position: relative;
  padding: 0.35rem 0.75rem;
  border: 1px solid $wa-border;
  border-radius: 999px;
  font-size: 0.82rem;
  color: $wa-ink;
  cursor: pointer;

  &.is-selected {
    border-color: $wa-accent;
    background: $wa-accent;
    color: #ffffff;
  }

  &:focus-within {
    outline: 2px solid $wa-accent;
    outline-offset: 2px;
  }
}

.design__photo {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.design__file {
  position: relative;
  display: inline-block;
  align-self: flex-start;
  padding: 0.4rem 0.85rem;
  border: 1px solid $wa-accent;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: $wa-accent;
  cursor: pointer;

  &:focus-within {
    outline: 2px solid $wa-accent;
    outline-offset: 2px;
  }
}

.design__range {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: $wa-ink-muted;

  input {
    accent-color: $wa-accent;
  }
}

.design__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.8rem;
  font-size: 0.85rem;
  color: $wa-ink-muted;

  input[type="text"],
  textarea {
    padding: 0.5rem 0.6rem;
    border: 1px solid $wa-border;
    border-radius: $wa-radius-md;
    background: $wa-surface-white;
    color: $wa-ink;
    font: inherit;
    resize: vertical;
  }

  input[type="color"] {
    width: 2.2rem;
    height: 2.2rem;
    padding: 0;
    border: 1px solid $wa-border;
    border-radius: 8px;
    background: none;
    cursor: pointer;
  }
}

.design__inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.design__link {
  border: 0;
  background: none;
  padding: 0;
  color: $wa-accent;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.design__thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 0.35rem;
}

.design__thumb {
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  background: $wa-border;
  cursor: pointer;

  &.is-selected {
    border-color: $wa-accent;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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
