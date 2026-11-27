<template>
  <!-- The chat view's markup lives in a shadow root: Vuetify, Tailwind's
       preflight and the page's own styles stop at its boundary, so the
       preview looks the way the PDF prints. -->
  <!-- A scrolling region: focusable, so it scrolls from the keyboard too. -->
  <div
    ref="host"
    class="chat-preview"
    tabindex="0"
    :aria-label="label || undefined"
  />
</template>

<script setup>
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  /** Blocks from chatViewHtml(). */
  html: { type: String, required: true },
  /** chatViewCss(options, "screen"). */
  css: { type: String, required: true },
  /** An A4-shaped wallpaper (data URL), repeated down the chat like pages. */
  background: { type: String, default: "" },
  /** Accessible name of the scrolling region. */
  label: { type: String, default: "" },
});

const host = ref(null);
let root = null;

function render() {
  if (!root) return;
  root.innerHTML = `<style>${props.css}</style><div class="cv-root">${props.html}</div>`;
  applyBackground();
}

// Set as a property rather than written into the CSS: a photo is megabytes
// of data URL, and the stylesheet is rebuilt on every option change.
function applyBackground() {
  const chat = root?.querySelector(".cv-root");
  if (!chat) return;
  chat.style.backgroundImage = props.background
    ? `url("${props.background}")`
    : "";
  chat.style.backgroundSize = "100% auto";
  chat.style.backgroundRepeat = "repeat-y";
}

onMounted(() => {
  root = host.value.attachShadow({ mode: "open" });
  render();
});

watch(() => [props.html, props.css], render);
watch(() => props.background, applyBackground);
</script>

<style lang="scss" scoped>
.chat-preview {
  /* phones: leave room for the controls under it */
  max-height: 55vh;

  @media (min-width: 900px) {
    max-height: calc(100vh - 8rem);
  }
  overflow-y: auto;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(17, 27, 33, 0.14);
  overscroll-behavior: contain;

  &:focus-visible {
    outline: 2px solid $wa-accent;
    outline-offset: 3px;
  }
}
</style>
