<template>
  <div class="story-slide" :class="`story-slide--${theme}`">
    <div class="story-slide__bg" aria-hidden="true">
      <span class="story-blob story-blob--a" />
      <span class="story-blob story-blob--b" />
      <slot name="bg" />
    </div>
    <div class="story-slide__body">
      <div class="story-slide__inner">
        <p v-if="eyebrow" class="story-eyebrow story-in">{{ eyebrow }}</p>
        <h2 v-if="title" class="story-title story-in" style="--i: 1">
          {{ title }}
        </h2>
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";

export type StoryTheme =
  | "ink"
  | "lime"
  | "violet"
  | "sunset"
  | "ocean"
  | "night"
  | "rose"
  | "cream"
  | "mint";

defineProps({
  title: {
    type: String,
    default: "",
  },
  /** The small line above the title. */
  eyebrow: {
    type: String,
    default: "",
  },
  theme: {
    type: String as PropType<StoryTheme>,
    default: "ink",
  },
});
</script>

<!-- Not scoped: the slides build on these classes (.story-in, .story-card,
     .story-btn …), and every slide reads its colours from the theme's
     custom properties instead of naming its own. -->
<style>
.story-slide {
  --s-bg: #0b1410;
  --s-fg: #ffffff;
  --s-muted: rgba(255, 255, 255, 0.72);
  --s-accent: #d6ff3f;
  --s-on-accent: #10210f;
  --s-card: rgba(255, 255, 255, 0.1);
  --s-line: rgba(255, 255, 255, 0.18);
  --s-blob-a: #25d366;
  --s-blob-b: #0e7a5f;

  position: relative;
  isolation: isolate;
  /* The big numbers size themselves by the card's width (cqw), which is a
     phone screen in one place and a 340px card in another. */
  container-type: inline-size;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--s-bg);
  color: var(--s-fg);
  font-variant-numeric: tabular-nums;
}

.story-slide--lime {
  --s-bg: #d6ff3f;
  --s-fg: #10210f;
  --s-muted: rgba(16, 33, 15, 0.72);
  --s-accent: #10210f;
  --s-on-accent: #d6ff3f;
  --s-card: rgba(16, 33, 15, 0.09);
  --s-line: rgba(16, 33, 15, 0.2);
  --s-blob-a: #9dff6b;
  --s-blob-b: #fff16b;
}

.story-slide--violet {
  --s-bg: linear-gradient(160deg, #4316e0 0%, #8a2df5 55%, #e440c4 100%);
  --s-accent: #d6ff3f;
  --s-on-accent: #1d0b45;
  --s-card: rgba(255, 255, 255, 0.14);
  --s-blob-a: #ff5fd2;
  --s-blob-b: #3b82ff;
}

.story-slide--sunset {
  --s-bg: linear-gradient(165deg, #ff8a1f 0%, #ff3d5a 60%, #d81b78 100%);
  --s-accent: #fff16b;
  --s-on-accent: #4a0d1c;
  --s-card: rgba(255, 255, 255, 0.16);
  --s-line: rgba(255, 255, 255, 0.28);
  --s-blob-a: #ffd23f;
  --s-blob-b: #ff5fa2;
}

.story-slide--ocean {
  --s-bg: linear-gradient(170deg, #052436 0%, #0a5b78 100%);
  --s-accent: #7df9c9;
  --s-on-accent: #052436;
  --s-blob-a: #22d3ee;
  --s-blob-b: #34d399;
}

.story-slide--night {
  --s-bg: linear-gradient(180deg, #0a0e24 0%, #1a1c4a 55%, #40286e 100%);
  --s-accent: #ffd66b;
  --s-on-accent: #1a1238;
  --s-blob-a: #6d5bff;
  --s-blob-b: #ff7ad9;
}

.story-slide--rose {
  --s-bg: #ffd9e8;
  --s-fg: #3d0a25;
  --s-muted: rgba(61, 10, 37, 0.72);
  --s-accent: #e0126f;
  --s-on-accent: #ffffff;
  --s-card: rgba(61, 10, 37, 0.08);
  --s-line: rgba(61, 10, 37, 0.18);
  --s-blob-a: #ff9ac4;
  --s-blob-b: #ffc56b;
}

.story-slide--cream {
  --s-bg: #fff3d1;
  --s-fg: #221a0c;
  --s-muted: rgba(34, 26, 12, 0.72);
  --s-accent: #ff4d2e;
  --s-on-accent: #ffffff;
  --s-card: rgba(34, 26, 12, 0.07);
  --s-line: rgba(34, 26, 12, 0.16);
  --s-blob-a: #ffcf5c;
  --s-blob-b: #ff9d7a;
}

.story-slide--mint {
  --s-bg: linear-gradient(165deg, #c6f7e2 0%, #5eead4 55%, #10b981 100%);
  --s-fg: #052e1c;
  --s-muted: rgba(5, 46, 28, 0.74);
  --s-accent: #052e1c;
  --s-on-accent: #c6f7e2;
  --s-card: rgba(5, 46, 28, 0.09);
  --s-line: rgba(5, 46, 28, 0.2);
  --s-blob-a: #ffffff;
  --s-blob-b: #34d399;
}

.story-slide__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.story-blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(56px);
  opacity: 0.55;
  animation: story-drift 9s ease-in-out infinite alternate;
}

.story-blob--a {
  top: -18%;
  right: -28%;
  width: 78%;
  aspect-ratio: 1;
  background: var(--s-blob-a);
}

.story-blob--b {
  bottom: -20%;
  left: -30%;
  width: 70%;
  aspect-ratio: 1;
  background: var(--s-blob-b);
  animation-delay: -4s;
}

/* On a phone the card starts at the top of the screen, under the site
   header: --story-top (set by the carousel) keeps the content clear of it. */
.story-slide__body {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: calc(var(--story-top, 0px) + 2rem) 1.25rem 1.25rem;
  /* A phone shorter than the slide scrolls it rather than cutting off its
     top and bottom: an iPhone SE with Safari's bars showing has some 550px,
     and the closing slide's title and buttons fell outside. */
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.story-slide__body::-webkit-scrollbar {
  display: none;
}

/* Centred while it fits; the auto margins give way when it does not, so a
   tall slide starts at its top instead of being centred past both edges. */
.story-slide__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  margin: auto 0;
  text-align: center;
}

.story-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--s-accent);
}

.story-title {
  margin: 0 0 0.25rem;
  max-width: 22rem;
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1.08;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.story-big {
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.story-muted {
  color: var(--s-muted);
}

.story-accent {
  color: var(--s-accent);
}

.story-card {
  border-radius: 1.1rem;
  background: var(--s-card);
  border: 1px solid var(--s-line);
}

.story-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  background: var(--s-card);
  border: 1px solid var(--s-line);
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.wrapped-scope .story-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.7rem 1.1rem;
  border-radius: 9999px;
  background: var(--s-accent);
  color: var(--s-on-accent);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.1;
  cursor: pointer;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}

.wrapped-scope .story-btn:hover {
  transform: translateY(-1px);
}

.wrapped-scope .story-btn:active {
  transform: scale(0.97);
}

.wrapped-scope .story-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.wrapped-scope .story-btn--ghost {
  background: var(--s-card);
  color: var(--s-fg);
  border: 1px solid var(--s-line);
}

.wrapped-scope .story-btn--small {
  padding: 0.5rem 0.9rem;
  font-size: 0.8rem;
}

/* Staggered entrance: set --i on an element to queue it behind the others. */
.story-in {
  animation: story-in 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.15) both;
  animation-delay: calc(var(--i, 0) * 110ms + 80ms);
}

.story-pop {
  animation: story-pop 0.6s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  animation-delay: calc(var(--i, 0) * 110ms + 80ms);
}

@keyframes story-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes story-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes story-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(6%, 8%, 0) scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-in,
  .story-pop,
  .story-blob {
    animation: none;
  }
}
</style>
