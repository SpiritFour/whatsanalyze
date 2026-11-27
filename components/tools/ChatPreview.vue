<template>
  <!-- The chat view's markup lives in a shadow root: Vuetify, Tailwind's
       preflight and the page's own styles stop at its boundary, so the
       preview looks the way the PDF prints. -->
  <div ref="host" class="chat-preview" />
</template>

<script setup>
import { onMounted, ref, watch } from "vue";

const props = defineProps({
  /** Blocks from chatViewHtml(). */
  html: { type: String, required: true },
  /** chatViewCss(options, "screen"). */
  css: { type: String, required: true },
});

const host = ref(null);
let root = null;

function render() {
  if (!root) return;
  root.innerHTML = `<style>${props.css}</style><div class="cv-root">${props.html}</div>`;
}

onMounted(() => {
  root = host.value.attachShadow({ mode: "open" });
  render();
});

watch(() => [props.html, props.css], render);
</script>

<style lang="scss" scoped>
.chat-preview {
  max-height: 70vh;
  overflow-y: auto;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(17, 27, 33, 0.14);
  overscroll-behavior: contain;
}
</style>
