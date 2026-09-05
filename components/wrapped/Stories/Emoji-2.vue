<template>
  <WrappedStoryContainer :title="t('results.emoji.messageTitle')">
    <div class="relative w-full max-w-xl py-12 text-2xl md:text-3xl">
      <div
        ref="cornerTL"
        class="pointer-events-none absolute left-6 top-4 h-6 w-6 border-l-2 border-t-2 border-sky-400/60"
      />
      <div
        ref="cornerTR"
        class="pointer-events-none absolute right-6 top-4 h-6 w-6 border-r-2 border-t-2 border-sky-400/60"
      />
      <div
        ref="cornerBL"
        class="pointer-events-none absolute bottom-4 left-6 h-6 w-6 border-b-2 border-l-2 border-sky-400/60"
      />
      <div
        ref="cornerBR"
        class="pointer-events-none absolute bottom-4 right-6 h-6 w-6 border-b-2 border-r-2 border-sky-400/60"
      />

      <div
        ref="messageViewport"
        class="relative z-10 mx-6 max-h-80 overflow-hidden text-center text-4xl leading-snug md:mx-10 md:max-h-52 md:text-5xl"
      >
        <div
          ref="messageContent"
          class="inline-block align-top whitespace-pre-line break-words"
        >
          {{ message?.message }}
        </div>
      </div>
    </div>

    <div class="pb-10 text-center text-lg font-semibold tracking-wide">
      {{ t('results.emoji.from') }}
      <span class="font-bold">{{ message?.author }}</span>
    </div>
  </WrappedStoryContainer>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { animate } from "motion";
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";

const statsStore = useStatsStore();
const { result } = storeToRefs(statsStore);
const { t } = useI18n();

const message = computed(() => {
  if (!result.value) return { author: "", message: "" };
  return result.value.getMostUsedEmojis.globalMessageWithMostEmojis;
});

// Corner element refs
const cornerTL = ref<HTMLElement | null>(null);
const cornerTR = ref<HTMLElement | null>(null);
const cornerBL = ref<HTMLElement | null>(null);
const cornerBR = ref<HTMLElement | null>(null);

// Message scrolling refs
const messageViewport = ref<HTMLElement | null>(null);
const messageContent = ref<HTMLElement | null>(null);

let scrollAnimation: ReturnType<typeof animate> | null = null;

const setupCornerGlow = () => {
  const corners = [
    cornerTL.value,
    cornerTR.value,
    cornerBL.value,
    cornerBR.value,
  ].filter(Boolean) as HTMLElement[];

  corners.forEach((el, i) => {
    animate(
      el,
      // @ts-ignore
      { opacity: [0.2, 0.7, 0.2] },
      {
        duration: 2.4,
        delay: i * 0.2,
        repeat: Infinity,
        easing: "ease-in-out",
      },
    );
  });
};

const setupAutoScroll = () => {
  const viewport = messageViewport.value;
  const content = messageContent.value;
  if (!viewport || !content) return;

  // cancel previous animation if any
  if (scrollAnimation && typeof scrollAnimation.cancel === "function") {
    scrollAnimation.cancel();
  }

  const overflow = content.scrollHeight - viewport.clientHeight;

  if (overflow <= 0) {
    // no overflow, ensure content is reset
    content.style.transform = "";
    return;
  }

  // slow, continuous up-and-down scroll
  scrollAnimation = animate(
    content,
    // @ts-ignore
    { y: [0, -overflow] },
    {
      duration: Math.min(overflow * 0.06, 30), // scale duration with overflow
      repeat: Infinity,
      direction: "alternate",
      easing: "linear",
      delay: 0.8,
    },
  );
};

onMounted(async () => {
  setupCornerGlow();
  await nextTick();
  setupAutoScroll();
});

// Recalculate scrolling whenever the message text changes
watch(
  () => message.value?.message,
  async () => {
    await nextTick();
    setupAutoScroll();
  },
);
</script>
