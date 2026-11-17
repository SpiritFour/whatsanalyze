<template>
  <div class="flex justify-center sm:m-8">
    <div
      class="story-frame fixed inset-x-0 top-0 z-50 sm:z-0 sm:relative sm:inset-auto w-screen sm:w-[340px] lg:w-[430px] max-w-full bg-black text-white sm:rounded-3xl overflow-hidden flex flex-col shadow-xl select-none"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <!-- On a phone the card is pinned over the whole screen, so a swipe
           cannot scroll the page out from under it and show the footer.
           On a phone the card fills the viewport starting at y=0, which puts
           the progress strip behind the sticky header for the whole story.
           Drop it below the header there; on a tablet and up the card is a
           regular block in the flow and the strip sits at its own top edge. -->
      <div class="story-progress absolute left-2 right-2 flex gap-1 z-20">
        <div
          v-for="(_, index) in slides"
          :key="index"
          class="story-progress__track h-1 flex-1 rounded-full overflow-hidden"
        >
          <div
            :style="progressStyle(index)"
            class="story-progress__fill h-full origin-left"
          />
        </div>
      </div>

      <!-- Tapping the left third steps back, anywhere else steps on; holding
           pauses, as stories do everywhere else. Pointer handlers instead of
           overlays: overlays covered the outer thirds of every button on a
           slide, so tapping the edge of "Share" went back a slide instead. -->
      <div
        class="relative flex-1 flex items-stretch justify-stretch min-h-0"
        @pointerdown="onPress"
        @pointerup="onRelease"
        @pointercancel="onCancel"
        @pointerleave="onCancel"
        @contextmenu.prevent
      >
        <!-- A crossfade, not out-in: out-in waits for the old slide to
             leave before rendering the next, and a burst of taps left it
             showing a stale slide with nothing on it. -->
        <transition name="story-fade">
          <div :key="activeIndex" class="w-full h-full">
            <component
              :is="slides[activeIndex].component"
              v-if="slides[activeIndex]"
              v-bind="slides[activeIndex].props"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
} from "vue";
import { analyticsWrapped } from "~/composables/useAnalytics";
import { STORY_CONTROLS, type StorySlide } from "~/utils/wrapped/story";

const props = defineProps({
  slides: {
    type: Array as PropType<StorySlide[]>,
    required: true,
  },
  duration: {
    type: Number,
    default: 6000,
  },
  // Off unless asked for: a story that stops whenever the pointer rests on
  // it never plays on a computer. Holding pauses it, as on a phone.
  pauseOnHover: {
    type: Boolean,
    default: false,
  },
});

const activeIndex = ref(0);
const progress = ref(0);
// Everything that is holding the story right now: the pointer resting on it,
// a finger held down, a slide waiting for a guess.
const pauses = reactive(new Set<string>());
const isPaused = computed(() => pauses.size > 0);

let rafId: number | null = null;
let lastTs = 0;

const storyCount = computed(() => props.slides.length);
const activeDuration = computed(
  () => props.slides[activeIndex.value]?.duration ?? props.duration,
);

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

    const delta = elapsed / activeDuration.value;
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

function goTo(index: number) {
  // A slide that was waiting (for a guess, say) must not hold the next one.
  for (const reason of [...pauses]) {
    if (reason !== "hover" && reason !== "hidden") pauses.delete(reason);
  }
  activeIndex.value = index;
  resetProgress();
}

function next() {
  if (activeIndex.value >= storyCount.value - 1) return;
  goTo(activeIndex.value + 1);
}

function prev() {
  if (activeIndex.value === 0) {
    resetProgress();
    return;
  }
  goTo(activeIndex.value - 1);
}

provide(STORY_CONTROLS, {
  pause: (reason: string) => pauses.add(reason),
  resume: (reason: string) => pauses.delete(reason),
  next,
});

const INTERACTIVE = "button, a, input, select, textarea, label";
/** Held this long, the story pauses. */
const HOLD_MS = 220;
/** Held this long, letting go is the end of a pause, not a tap. */
const TAP_MS = 450;
/** A finger that moved this far was scrolling or swiping, not tapping. */
const TAP_SLOP = 12;
let holdTimer: ReturnType<typeof setTimeout> | null = null;
let press: { id: number; x: number; y: number; at: number } | null = null;

function onPress(event: PointerEvent) {
  if (!event.isPrimary || event.button > 0) return;
  if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
  press = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    at: performance.now(),
  };
  holdTimer = setTimeout(() => pauses.add("hold"), HOLD_MS);
}

function endHold() {
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = null;
  pauses.delete("hold");
}

/**
 * Steps on letting go, not on `click`. iOS takes two quick taps on the same
 * spot for a double-tap and sends one click for both, so tapping fast
 * through the story dropped every other slide: on a phone, 13 taps moved it
 * on 3.
 */
function onRelease(event: PointerEvent) {
  const started = press;
  press = null;
  endHold();
  if (!started || started.id !== event.pointerId) return;
  if (performance.now() - started.at >= TAP_MS) return;
  if (
    Math.abs(event.clientX - started.x) > TAP_SLOP ||
    Math.abs(event.clientY - started.y) > TAP_SLOP
  ) {
    return;
  }

  const area = event.currentTarget as HTMLElement;
  const { left, width } = area.getBoundingClientRect();
  const x = event.clientX - left;
  if (x < width / 3) prev();
  else next();
}

function onCancel() {
  press = null;
  endHold();
}

function onKey(event: KeyboardEvent) {
  // Not always an element: a key event can be aimed at the window itself.
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("input, textarea, select")) return;
  if (event.key === "ArrowRight") next();
  else if (event.key === "ArrowLeft") prev();
}

// Away in another app (WhatsApp, to send the card): the story is where it
// was left on coming back.
function onVisibility() {
  if (document.hidden) pauses.add("hidden");
  else pauses.delete("hidden");
}

function onMouseEnter() {
  if (props.pauseOnHover) pauses.add("hover");
}

function onMouseLeave() {
  pauses.delete("hover");
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
    if (import.meta.client) startLoop();
  },
  { immediate: true },
);

// Each slide under its own name: the list is built from what a chat has to
// show (pages/wrapped/results.vue), so an index alone says nothing.
function trackSlide(index: number) {
  const slideName = props.slides[index]?.name || `Slide${index}`;
  analyticsWrapped.slideView(slideName, index);
}
watch(activeIndex, trackSlide);

onMounted(() => {
  startLoop();
  trackSlide(0);
  window.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVisibility);
});
onBeforeUnmount(() => {
  stopLoop();
  if (holdTimer) clearTimeout(holdTimer);
  window.removeEventListener("keydown", onKey);
  document.removeEventListener("visibilitychange", onVisibility);
});
</script>

<style scoped>
/* The visible viewport, not 100vh: on a phone that includes the part under
   the browser's own bars, and the last slide's buttons sat below the fold. */
.story-frame {
  height: 100vh;
  height: 100dvh;
  --story-top: var(--wa-header-height, 52px);
  touch-action: manipulation;
  -webkit-touch-callout: none;
}

.story-progress {
  top: calc(var(--wa-header-height, 52px) + 0.5rem);
}

/* Readable on the light slides and the dark ones alike: a light bar with a
   dark edge, whatever is behind it. */
.story-progress__track {
  background: rgba(255, 255, 255, 0.38);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.16);
}

.story-progress__fill {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.22);
}

@media (min-width: 640px) {
  .story-frame {
    height: 604px;
    --story-top: 0px;
  }

  .story-progress {
    top: 0.6rem;
  }
}

@media (min-width: 1024px) {
  .story-frame {
    height: 764px;
  }
}

/* The leaving slide is lifted out of the flow and fades over the new one. */
.story-fade-leave-active {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.story-fade-enter-active,
.story-fade-leave-active {
  transition: opacity 0.18s ease;
}

.story-fade-enter-from,
.story-fade-leave-to {
  opacity: 0;
}
</style>
