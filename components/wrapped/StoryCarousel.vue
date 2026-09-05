<template>
  <div class="flex justify-center m-8">
    <div
      class="absolute top-0 z-50 sm:z-0 sm:relative w-screen sm:w-[320px] lg:w-[500px] max-w-full h-screen sm:h-[560px] lg:h-[800px] bg-black text-white rounded-2xl overflow-hidden flex flex-col shadow-xl select-none"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div class="absolute top-2 left-2 right-2 flex gap-1 z-20">
        <div
          v-for="(_, index) in stories"
          :key="index"
          class="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
        >
          <div
            :style="progressStyle(index)"
            class="h-full bg-white origin-left"
          />
        </div>
      </div>

      <div class="relative flex-1 flex items-stretch justify-stretch">
        <div class="absolute inset-y-0 left-0 w-1/3 z-20" @click="prev" />
        <div class="absolute inset-y-0 right-0 w-1/3 z-20" @click="next" />

        <transition mode="out-in" name="fade">
          <div :key="activeIndex" class="w-full h-full">
            <component :is="stories[activeIndex]" />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
} from "vue";

const { trackStorySlideViewed } = useAnalytics();

const props = defineProps({
  duration: {
    type: Number,
    default: 5000,
  },
  pauseOnHover: {
    type: Boolean,
    default: true,
  },
});

const slots = useSlots();
const stories = computed(() => (slots.default ? slots.default() : []));

const activeIndex = ref(0);
const progress = ref(0);
const isPaused = ref(false);

let rafId: number | null = null;
let lastTs = 0;

const storyCount = computed(() => stories.value.length);

function resetProgress() {
  progress.value = 0;
  lastTs = performance.now();
}

function loop(ts: number) {
  if (isPaused.value) {
    lastTs = ts;
  } else {
    const elapsed = ts - lastTs;
    lastTs = ts;

    const delta = elapsed / props.duration;
    progress.value = Math.min(1, progress.value + delta);

    if (progress.value >= 1) {
      next();
    }
  }

  rafId = requestAnimationFrame(loop);
}

function startLoop() {
  if (rafId !== null) return;
  lastTs = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function next() {
  if (activeIndex.value === storyCount.value - 1) return;

  activeIndex.value = (activeIndex.value + 1) % storyCount.value;
  resetProgress();
}

function prev() {
  activeIndex.value =
    (activeIndex.value - 1 + storyCount.value) % storyCount.value;
  resetProgress();
}

function onMouseEnter() {
  if (props.pauseOnHover) isPaused.value = true;
}

function onMouseLeave() {
  if (props.pauseOnHover) isPaused.value = false;
}

function progressStyle(index: number) {
  if (index < activeIndex.value) return { transform: "scaleX(1)" };
  if (index > activeIndex.value) return { transform: "scaleX(0)" };
  return { transform: `scaleX(${progress.value})` };
}

watch(
  storyCount,
  (count) => {
    if (!count) {
      stopLoop();
      activeIndex.value = 0;
      progress.value = 0;
      return;
    }

    if (activeIndex.value >= count) {
      activeIndex.value = 0;
    }

    resetProgress();
    startLoop();
  },
  { immediate: true },
);

const slideNames = [
  "Intro1",
  "Intro2",
  "Emoji1",
  "Emoji2",
  "Words1",
  "Words2",
  "Words3",
  "Conversation1",
  "Conversation2",
  "ShareInvite",
];

watch(activeIndex, (newIndex) => {
  const slideName = slideNames[newIndex] || `Slide${newIndex}`;
  trackStorySlideViewed(newIndex, slideName);
});

onMounted(() => {
  startLoop();
  trackStorySlideViewed(0, slideNames[0]);
});
onBeforeUnmount(stopLoop);
</script>
