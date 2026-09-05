<template>
  <div
    class="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-green-800 text-white/80"
  >

    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse,rgba(0,0,0,0)_0,rgba(0,0,0,0.9)_80%)]"
    />

    <div>
      <div
        v-for="n in 10"
        :key="'v-' + n"
        :style="{ left: `${(n / 10) * 100}%` }"
        class="absolute inset-y-0 w-px bg-white/10"
      />
      <div
        v-for="n in 14"
        :key="'h-' + n"
        :style="{ top: `${(n / 14) * 100}%` }"
        class="absolute inset-x-0 h-px bg-white/10"
      />
    </div>


    <div class="absolute inset-0 text-xs font-semibold tracking-tight">
      <span
        v-for="t in text"
        :key="t.text"
        :class="['calc-float', t.delayClass && t.delayClass]"
        :style="t.style"
        class="absolute"
      >
        {{ t.text }}
      </span>
    </div>


    <svg
      v-for="graph in graphs"
      :key="graph.id"
      :class="graph.positionClass"
      :viewBox="graph.viewBox"
      fill="none"
    >
      <path
        :class="['graph-line', graph.delayClass && graph.delayClass]"
        :d="graph.d"
      />
    </svg>
  </div>
</template>

<script lang="ts" setup>
const text = [
  {
    text: "Hello...",
    style: { top: "18%", left: "14%" },
    delayClass: "",
  },
  {
    text: "Whats up today?",
    style: { top: "32%", right: "12%" },
    delayClass: "delay-1",
  },
  {
    text: "I am feeling great now!",
    style: { bottom: "22%", left: "24%" },
    delayClass: "delay-2",
  },
  {
    text: "That is soooo cool!!",
    style: { bottom: "14%", right: "18%" },
    delayClass: "delay-3",
  },
];

const graphs = [
  {
    id: "graph-1",
    positionClass: "absolute right-[-10%] top-[18%] h-40 w-56 opacity-80",
    viewBox: "0 0 100 60",
    d: "M0 52 Q 25 30 45 40 T 100 5",
    delayClass: "",
  },
  {
    id: "graph-2",
    positionClass: "absolute left-[8%] top-[45%] h-48 w-64 opacity-80",
    viewBox: "0 0 100 70",
    d: "M0 60 Q 15 45 30 50 T 60 35 T 100 10",
    delayClass: "graph-line-delay",
  },
  {
    id: "graph-3",
    positionClass: "absolute left-[40%] bottom-[10%] h-32 w-64 opacity-80",
    viewBox: "0 0 100 50",
    d: "M0 35 Q 10 10 25 25 T 50 40 T 75 20 T 100 30",
    delayClass: "graph-line-delay-2",
  },
];
</script>

<style scoped>
/* Floating text */
@keyframes calc-float {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translate3d(18px, -26px, 0) scale(1.03);
    opacity: 0;
  }
}

.calc-float {
  opacity: 0;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  animation: calc-float 10s ease-in-out infinite;
}

.delay-1 {
  animation-delay: 2s;
  rotate: 40deg;
}
.delay-2 {
  animation-delay: 4s;
  rotate: 20deg;
}
.delay-3 {
  animation-delay: 6s;
  rotate: -10deg;
}

/* Graph lines being drawn */
@keyframes draw-line {
  0% {
    stroke-dashoffset: 260;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.graph-line {
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-dasharray: 260;
  stroke-dashoffset: 260;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.7));
  animation: draw-line 6s ease-in-out infinite alternate;
}

.graph-line-delay {
  animation-delay: 1.5s;
}

.graph-line-delay-2 {
  animation-delay: 3s;
}
</style>
