<template>
  <div class="relative overflow-hidden text-black">
    <canvas ref="canvas" class="w-full h-full absolute inset-0"></canvas>
    <div class="relative z-10 w-full h-full">
      <slot/>
    </div>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue';

const canvas = ref(null);
let animationId = null;

// A simple function that draws a moving radial gradient
function draw() {
  if (!canvas.value) return;

  const ctx = canvas.value.getContext('2d');
  const {width, height} = canvas.value;

  // Time-based angle for a shift effect
  const time = performance.now() * 0.001;

  // Center moves around in a circular pattern
  let centerX = width / 2 + Math.sin(time) * width / 2;
  let centerY = height / 2 + Math.cos(time * 0.8) * height / 2;

  // Create a large radial gradient that covers the canvas
  centerX = centerX > width ? width : centerX;
  centerY = centerY > height ? height : centerY;

  centerX = centerX < 0 ? 0 : centerX;
  centerY = centerY < 0 ? 0 : centerY;

  const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
  );

  // Add color stops for your gradient
  gradient.addColorStop(0, 'rgb(255, 150, 0)');
  gradient.addColorStop(0.33, 'rgb(255,0,98)');
  gradient.addColorStop(0.66, 'rgb(100, 0, 255)');
  gradient.addColorStop(1, 'rgb(0,196,255)');

  // Fill the canvas
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Animation loop
function animate() {
  draw();
  animationId = requestAnimationFrame(animate);
}

// Make the canvas match its container size
function resizeCanvas() {
  if (!canvas.value) return;
  canvas.value.width = canvas.value.offsetWidth;
  canvas.value.height = canvas.value.offsetHeight;
}

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  animate();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (animationId) cancelAnimationFrame(animationId);
});
</script>
