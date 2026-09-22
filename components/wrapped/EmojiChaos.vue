<!-- EmojiChaos.vue -->
<template>
  <div ref="stage" class="absolute w-full h-full stage -translate-x-1/2">
    <span
      v-for="(emoji, index) in emojiInstances"
      :key="index"
      ref="emojiEls"
      class="absolute origin-top emoji"
    >
      {{ emoji }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { animate } from "motion";

const props = defineProps({
  emojis: {
    type: Array as PropType<string[]>,
    required: true,
  },
  count: {
    type: Number,
    default: 24,
  },
  duration: {
    type: Number,
    default: 6,
  },
  maxRandomDelay: {
    type: Number,
    default: 2,
  },
  minScale: {
    type: Number,
    default: 0.8,
  },
  maxScale: {
    type: Number,
    default: 8,
  },
});

const stage = ref<HTMLElement | null>(null);
// v-for ref array
const emojiEls = ref<HTMLElement[]>([]);

interface Control {
  cancel: () => void;
  x?: number[];
}

let controls: Control[] = [];

const emojiInstances = computed(() => {
  const result: string[] = [];
  if (!props.emojis.length) return result;
  for (let i = 0; i < props.count; i++) {
    result.push(props.emojis[i % props.emojis.length]);
  }
  return result;
});

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type Point = { x: number; y: number };

function randomPoint(
  width: number,
  height: number,
  previousPoint?: Point,
  maxAttempts = 100,
): Point {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 3;
  const ry = height / 3;
  const rx2 = rx * rx;
  const ry2 = ry * ry;

  function isInsideEllipse(p: Point): boolean {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return (dx * dx) / rx2 + (dy * dy) / ry2 <= 1;
  }

  function segmentIntersectsEllipse(p1: Point, p2: Point): boolean {
    // Parametric line: P(t) = p1 + t*(p2 - p1), t in [0, 1]
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Quadratic coefficients for plugging into ellipse equation
    const x0 = p1.x - cx;
    const y0 = p1.y - cy;

    const a = (dx * dx) / rx2 + (dy * dy) / ry2;
    const b = (2 * x0 * dx) / rx2 + (2 * y0 * dy) / ry2;
    const c = (x0 * x0) / rx2 + (y0 * y0) / ry2 - 1;

    // If a is ~0, it's degenerate (p1 == p2), treat as no intersection beyond point check
    if (Math.abs(a) < 1e-12) {
      return isInsideEllipse(p1);
    }

    const disc = b * b - 4 * a * c;
    if (disc < 0) return false; // no intersection with infinite line

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    // If any intersection lies within the segment, it's a hit
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }

  for (let i = 0; i < maxAttempts; i++) {
    const candidate: Point = {
      x: Math.random() * width,
      y: Math.random() * height,
    };

    // Must be outside the ellipse
    if (isInsideEllipse(candidate)) continue;

    // If we have a previous point (assumed valid), ensure the segment doesn't cross the ellipse
    if (previousPoint) {
      // (If previousPoint somehow is inside ellipse, just ignore the segment constraint)
      if (
        !isInsideEllipse(previousPoint) &&
        segmentIntersectsEllipse(previousPoint, candidate)
      ) {
        continue;
      }
    }

    return candidate;
  }

  // Fallback (very rare): loosen to "outside ellipse" only
  // to avoid infinite loops if geometry gets weird.
  for (let i = 0; i < maxAttempts; i++) {
    const candidate: Point = {
      x: Math.random() * width,
      y: Math.random() * height,
    };
    if (!isInsideEllipse(candidate)) return candidate;
  }

  // Ultra-fallback: top-left corner (guaranteed outside the center ellipse)
  return { x: 0, y: 0 };
}

function createEmojiAnimation(el: HTMLElement, width: number, height: number) {
  const start = randomPoint(width, height);

  const steps = 5;
  const transforms: string[] = [];

  for (let i = 0; i < steps; i++) {
    const next = randomPoint(width, height, start);
    const rotate = randomBetween(-180, 180);

    transforms.push(
      `translate(${next.x}px, ${next.y}px) rotate(${rotate}deg) scale(${1})`,
    );
  }

  const delay = randomBetween(0, props.maxRandomDelay);
  const totalDuration = randomBetween(
    props.duration * 0.7,
    props.duration * 1.3,
  );

  const scale = randomBetween(props.minScale, props.maxScale);
  const fontSize = 14 * scale;
  el.style.fontSize = `${fontSize}px`;

  el.style.transform = `translate(${start.x}px, ${start.y}px)`;
  el.style.opacity = "1";

  // ✅ Force the correct overload by typing keyframes & options
  const keyframes = {
    transform: transforms,
    opacity: 1,
  };

  const options = {
    duration: totalDuration,
    delay,
    easing: "linear",
    repeat: Infinity,
    direction: "alternate",
  };

  return animate(el, keyframes, options);
}

function clearAnimations() {
  controls.forEach((c) => c.cancel());
  controls = [];
}

async function initAnimations() {
  if (!stage.value) return;

  clearAnimations();
  await nextTick();

  const rect = stage.value.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  emojiEls.value.forEach((el) => {
    if (!el) return;
    const control = createEmojiAnimation(el, width, height);
    controls.push(control);
  });
}

onMounted(() => {
  initAnimations();

  const resizeObserver = new ResizeObserver(() => {
    initAnimations();
  });

  if (stage.value) resizeObserver.observe(stage.value);
  (stage as any)._resizeObserver = resizeObserver;
});

onBeforeUnmount(() => {
  clearAnimations();
  const ro: ResizeObserver | undefined = (stage as any)._resizeObserver;
  if (ro && stage.value) ro.unobserve(stage.value as Element);
});

watch(
  () => [props.emojis, props.count, props.duration, props.maxRandomDelay],
  () => {
    initAnimations();
  },
  { deep: true },
);
</script>

<style scoped>
.emoji {
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Noto Color Emoji",
    sans-serif;
}

.stage {
  transform-origin: center;
}
</style>
