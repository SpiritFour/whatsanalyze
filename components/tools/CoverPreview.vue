<template>
  <!-- The PDF's cover page, drawn from the same markup the PDF prints, at
       A4 proportions and scaled down to fit. -->
  <div ref="frame" class="cover-preview" :style="{ height: `${height}px` }">
    <div
      ref="host"
      class="cover-preview__page"
      :style="{
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        padding: `${margin}px`,
        background,
        transform: `scale(${scale})`,
      }"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  /** chatCoverHtml() */
  html: { type: String, required: true },
  /** chatPagesCss() */
  css: { type: String, required: true },
  /** The cover's background colour. */
  background: { type: String, required: true },
  /** Sheet size and margin in CSS px (A4 at 96 dpi by default). */
  pageWidth: { type: Number, default: 793.7 },
  pageHeight: { type: Number, default: 1122.5 },
  margin: { type: Number, default: 45.4 },
});

const frame = ref(null);
const host = ref(null);
const width = ref(0);
let root = null;
let observer = null;

const scale = computed(() => (width.value ? width.value / props.pageWidth : 0));
const height = computed(() => props.pageHeight * scale.value);

function render() {
  if (!root) return;
  root.innerHTML = `<style>${props.css}</style>${props.html}`;
}

onMounted(() => {
  root = host.value.attachShadow({ mode: "open" });
  render();
  observer = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width;
  });
  observer.observe(frame.value);
});

onBeforeUnmount(() => observer?.disconnect());

watch(() => [props.html, props.css], render);
</script>

<style lang="scss" scoped>
.cover-preview {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(17, 27, 33, 0.14);
}

.cover-preview__page {
  /* inherited styles cross into the shadow root: reset what the page sets */
  text-align: left;
  line-height: normal;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  transform-origin: top left;
}
</style>
