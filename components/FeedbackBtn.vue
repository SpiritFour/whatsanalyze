<template>
  <!-- Fixed to the viewport, so it lands in the middle of the downloaded
       summary image if html2canvas is allowed to see it. -->
  <div class="bottom-right" data-html2canvas-ignore>
    <button type="button" class="tab" @click="dialog = true">
      <span class="rotate-text">{{ $t("writeUs") }}</span>
      <IconPencil class="rotate-image" />
    </button>

    <!-- The form is the only thing on the landing page that needs Vuetify's
         dialog, text fields and rating, and nobody sees it until they ask
         for it. Out here it keeps ~8 KB of render-blocking CSS off every
         page in the site. -->
    <LazyFeedbackDialog v-if="dialog" @close="dialog = false" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
    };
  },
};
</script>

<style scoped>
.bottom-right {
  position: fixed;
  right: 0;
  bottom: 10vh;
  z-index: 2;
}

.rotate-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.rotate-image {
  transform: rotate(-90deg);
}

/* A tab glued to the edge of the window, reading bottom-to-top. */
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.9rem 0.5rem;
  border: none;
  border-radius: 10px 0 0 10px;
  background: #00535f;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  transition: background 0.2s ease;
}

.tab:hover {
  background: #0c808c;
}
</style>
