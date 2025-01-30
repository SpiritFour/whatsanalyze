<template>
  <div
      class="absolute left-0 top-1/2 -translate-y-1/2 w-56 h-56 bg-gradient -rotate-12 animate-wiggle-pulse hidden md:block"
      style="clip-path: polygon(0 0, 100% 50%, 0 100%)"
  />


  <div
      class="absolute -right-10 top-1/3 -translate-y-1/3 w-48 h-56 bg-gradient rotate-45 animate-wiggle-pulse-1 hidden md:block"
      style="clip-path: polygon(100% 0, 0 50%, 100% 100%)"
  />

  <div
      class="absolute right-24 top-2/3 -translate-y-1/3 w-28 h-12 bg-gradient -rotate-45 animate-wiggle-pulse-2 hidden md:block"
      style="clip-path: polygon(100% 0, 0 50%, 100% 100%)"
  />

</template>

<style scoped>

.animate-wiggle-pulse {
  animation: pulse 8s infinite linear, wiggle 6s ease-in-out infinite;
}

.animate-wiggle-pulse-1 {
  animation: pulse 10s infinite linear, wiggle 5s ease-in-out infinite;
  animation-direction: reverse;
}

.animate-wiggle-pulse-2 {
  animation: pulse 7s infinite linear, wiggle2 10s ease-in-out infinite;
  animation-direction: reverse;

}

@keyframes wiggle {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

@keyframes wiggle2 {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(0deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

</style>
<script lang="ts" setup>
</script>